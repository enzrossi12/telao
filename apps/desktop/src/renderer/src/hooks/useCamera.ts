import { useCallback, useEffect, useState } from 'react'
import { RemoteTrackPublication, Room, RoomEvent, Track, VideoPresets } from 'livekit-client'

const DEVICE_STORAGE_KEY = 'telao.cameraDeviceId'

interface UseCamera {
  devices: MediaDeviceInfo[]
  selectedDeviceId: string | undefined
  isBusy: boolean
  hasFailed: boolean
  setCameraEnabled: (enabled: boolean) => Promise<void>
  selectDevice: (deviceId: string) => Promise<void>
}

function subscribeIfCamera(publication: RemoteTrackPublication): void {
  if (publication.source === Track.Source.Camera) publication.setSubscribed(true)
}

// false: listing must not turn the camera on just to ask for permission.
async function listCameras(): Promise<MediaDeviceInfo[]> {
  const devices = await Room.getLocalDevices('videoinput', false)
  return devices.filter((device) => device.deviceId !== '')
}

export function useCamera(room: Room | null): UseCamera {
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
  const [savedDeviceId, setSavedDeviceId] = useState(
    () => localStorage.getItem(DEVICE_STORAGE_KEY) ?? undefined
  )
  const [isBusy, setIsBusy] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)

  // A remembered camera may have been unplugged, so it only counts while it is listed.
  const selectedDeviceId = devices.some((device) => device.deviceId === savedDeviceId)
    ? savedDeviceId
    : undefined

  useEffect(() => {
    if (!room) return

    const refreshDevices = (): void => {
      listCameras().then(setDevices)
    }

    room.remoteParticipants.forEach((participant) =>
      participant.trackPublications.forEach(subscribeIfCamera)
    )
    refreshDevices()

    room.on(RoomEvent.TrackPublished, subscribeIfCamera)
    room.on(RoomEvent.MediaDevicesChanged, refreshDevices)
    return () => {
      room.off(RoomEvent.TrackPublished, subscribeIfCamera)
      room.off(RoomEvent.MediaDevicesChanged, refreshDevices)
    }
  }, [room])

  const setCameraEnabled = useCallback(
    async (enabled: boolean): Promise<void> => {
      if (!room) return
      setIsBusy(true)
      setHasFailed(false)
      try {
        await room.localParticipant.setCameraEnabled(
          enabled,
          { resolution: VideoPresets.h720.resolution, deviceId: selectedDeviceId },
          { videoEncoding: VideoPresets.h720.encoding, simulcast: true }
        )
        setDevices(await listCameras())
      } catch (err) {
        console.error('Camera toggle failed', err)
        setHasFailed(true)
      } finally {
        setIsBusy(false)
      }
    },
    [room, selectedDeviceId]
  )

  const selectDevice = useCallback(
    async (deviceId: string): Promise<void> => {
      setSavedDeviceId(deviceId)
      localStorage.setItem(DEVICE_STORAGE_KEY, deviceId)
      setHasFailed(false)
      try {
        await room?.switchActiveDevice('videoinput', deviceId)
      } catch (err) {
        console.error('Camera switch failed', err)
        setHasFailed(true)
      }
    },
    [room]
  )

  return { devices, selectedDeviceId, isBusy, hasFailed, setCameraEnabled, selectDevice }
}
