import { useCallback, useEffect, useRef, useState } from 'react'
import {
  AudioPresets,
  LocalTrackPublication,
  RemoteParticipant,
  RemoteTrackPublication,
  Room,
  RoomEvent,
  ScreenSharePresets,
  Track
} from 'livekit-client'
import { ScreenAudioSource, startScreenAudio } from '../lib/screenAudio'

export interface UseScreenShare {
  isBusy: boolean
  hasFailed: boolean
  hasAudioFailed: boolean
  startSharing: (sourceId: string, withAudio: boolean) => Promise<void>
  stopSharing: () => Promise<void>
  setWatching: (identity: string, watching: boolean) => void
}

// The sound arrives after the video, possibly when someone is already watching.
function subscribeLateScreenAudio(
  publication: RemoteTrackPublication,
  participant: RemoteParticipant
): void {
  if (
    publication.source === Track.Source.ScreenShareAudio &&
    participant.getTrackPublication(Track.Source.ScreenShare)?.isSubscribed
  ) {
    publication.setSubscribed(true)
  }
}

export function useScreenShare(room: Room | null): UseScreenShare {
  const [isBusy, setIsBusy] = useState(false)
  const [hasFailed, setHasFailed] = useState(false)
  const [hasAudioFailed, setHasAudioFailed] = useState(false)
  const audioRef = useRef<ScreenAudioSource | null>(null)

  useEffect(() => {
    if (!room) return

    // Also covers the captured window being closed, which ends the video by itself.
    const handleLocalUnpublished = (publication: LocalTrackPublication): void => {
      if (publication.source !== Track.Source.ScreenShare || !audioRef.current) return
      room.localParticipant.unpublishTrack(audioRef.current.track)
      audioRef.current.stop()
      audioRef.current = null
    }

    room.on(RoomEvent.TrackPublished, subscribeLateScreenAudio)
    room.on(RoomEvent.LocalTrackUnpublished, handleLocalUnpublished)
    return () => {
      room.off(RoomEvent.TrackPublished, subscribeLateScreenAudio)
      room.off(RoomEvent.LocalTrackUnpublished, handleLocalUnpublished)
      audioRef.current?.stop()
      audioRef.current = null
    }
  }, [room])

  const startSharing = useCallback(
    async (sourceId: string, withAudio: boolean): Promise<void> => {
      if (!room) return
      setIsBusy(true)
      setHasFailed(false)
      setHasAudioFailed(false)
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
        setIsBusy(false)
        return
      }

      // The video keeps going when only the sound fails.
      if (withAudio) {
        try {
          const audio = await startScreenAudio()
          audioRef.current = audio
          await room.localParticipant.publishTrack(audio.track, {
            source: Track.Source.ScreenShareAudio,
            audioPreset: AudioPresets.musicHighQualityStereo,
            forceStereo: true,
            dtx: false,
            red: false
          })
        } catch (err) {
          console.error('Screen audio failed', err)
          audioRef.current?.stop()
          audioRef.current = null
          setHasAudioFailed(true)
        }
      }
      setIsBusy(false)
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
      const participant = room?.remoteParticipants.get(identity)
      participant?.getTrackPublication(Track.Source.ScreenShare)?.setSubscribed(watching)
      participant?.getTrackPublication(Track.Source.ScreenShareAudio)?.setSubscribed(watching)
    },
    [room]
  )

  return { isBusy, hasFailed, hasAudioFailed, startSharing, stopSharing, setWatching }
}
