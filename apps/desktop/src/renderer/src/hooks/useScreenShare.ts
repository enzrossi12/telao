import { useCallback, useEffect, useState } from 'react'
import {
  RemoteParticipant,
  RemoteTrackPublication,
  Room,
  RoomEvent,
  ScreenSharePresets,
  Track
} from 'livekit-client'

export interface UseScreenShare {
  isBusy: boolean
  hasFailed: boolean
  startSharing: (sourceId: string) => Promise<void>
  stopSharing: () => Promise<void>
  setWatching: (identity: string, watching: boolean) => void
}

function notifyIfLive(publication: RemoteTrackPublication, participant: RemoteParticipant): void {
  if (publication.source === Track.Source.ScreenShare && !document.hasFocus()) {
    new Notification('Telão', { body: `${participant.name || participant.identity} está ao vivo` })
  }
}

export function useScreenShare(room: Room | null): UseScreenShare {
  const [isBusy, setIsBusy] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)

  useEffect(() => {
    if (!room) return
    room.on(RoomEvent.TrackPublished, notifyIfLive)
    return () => {
      room.off(RoomEvent.TrackPublished, notifyIfLive)
    }
  }, [room])

  const startSharing = useCallback(
    async (sourceId: string): Promise<void> => {
      if (!room) return
      setIsBusy(true)
      setHasFailed(false)
      try {
        await window.telao.selectScreenSource(sourceId)
        await room.localParticipant.setScreenShareEnabled(
          true,
          {
            audio: false,
            resolution: ScreenSharePresets.h720fps30.resolution,
            contentHint: 'motion'
          },
          {
            screenShareEncoding: ScreenSharePresets.h720fps30.encoding,
            videoCodec: 'h264',
            simulcast: true
          }
        )
      } catch (err) {
        console.error('Screen share failed', err)
        setHasFailed(true)
      } finally {
        setIsBusy(false)
      }
    },
    [room]
  )

  const stopSharing = useCallback(async (): Promise<void> => {
    if (!room) return
    setIsBusy(true)
    try {
      await room.localParticipant.setScreenShareEnabled(false)
    } finally {
      setIsBusy(false)
    }
  }, [room])

  const setWatching = useCallback(
    (identity: string, watching: boolean): void => {
      room?.remoteParticipants
        .get(identity)
        ?.getTrackPublication(Track.Source.ScreenShare)
        ?.setSubscribed(watching)
    },
    [room]
  )

  return { isBusy, hasFailed, startSharing, stopSharing, setWatching }
}
