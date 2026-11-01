import { useCallback, useRef, useState } from 'react'
import {
  AudioTrack,
  DisconnectReason,
  Participant,
  Room,
  RoomEvent,
  Track,
  VideoTrack
} from 'livekit-client'
import { createRoom, fetchToken, JoinError, JoinRequest, TokenError } from '../lib/token'

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting'

export interface RoomParticipant {
  identity: string
  name: string
  isLocal: boolean
  isCameraOn: boolean
  cameraTrack: VideoTrack | null
  isLive: boolean
  screenTrack: VideoTrack | null
  isWatchingScreen: boolean
  screenAudioTrack: AudioTrack | null
}

interface UseRoom {
  room: Room | null
  roomName: string | null
  status: ConnectionStatus
  participants: RoomParticipant[]
  error: JoinError | null
  clearError: () => void
  join: (request: JoinRequest, create: boolean) => Promise<string | null>
  leave: () => Promise<void>
}

// Anything that changes what the participant list shows.
const PARTICIPANT_EVENTS = [
  RoomEvent.ParticipantConnected,
  RoomEvent.ParticipantDisconnected,
  RoomEvent.ParticipantNameChanged,
  RoomEvent.TrackPublished,
  RoomEvent.TrackUnpublished,
  RoomEvent.TrackMuted,
  RoomEvent.TrackUnmuted,
  RoomEvent.TrackSubscribed,
  RoomEvent.TrackUnsubscribed,
  RoomEvent.TrackSubscriptionStatusChanged,
  RoomEvent.LocalTrackPublished,
  RoomEvent.LocalTrackUnpublished
] as const

function toRoomParticipant(participant: Participant, isLocal: boolean): RoomParticipant {
  const screen = participant.getTrackPublication(Track.Source.ScreenShare)
  return {
    identity: participant.identity,
    name: participant.name || participant.identity,
    isLocal,
    isCameraOn: participant.isCameraEnabled,
    cameraTrack: participant.getTrackPublication(Track.Source.Camera)?.videoTrack ?? null,
    isLive: participant.isScreenShareEnabled,
    screenTrack: screen?.videoTrack ?? null,
    // Our own screen is a local preview: it needs no subscription.
    isWatchingScreen: isLocal ? Boolean(screen) : (screen?.isSubscribed ?? false),
    screenAudioTrack:
      participant.getTrackPublication(Track.Source.ScreenShareAudio)?.audioTrack ?? null
  }
}

function listParticipants(room: Room): RoomParticipant[] {
  const remote = [...room.remoteParticipants.values()]
    .map((participant) => toRoomParticipant(participant, false))
    .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  return [toRoomParticipant(room.localParticipant, true), ...remote]
}

export function useRoom(): UseRoom {
  const roomRef = useRef<Room | null>(null)
  const [activeRoom, setActiveRoom] = useState<Room | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const [participants, setParticipants] = useState<RoomParticipant[]>([])
  const [error, setError] = useState<JoinError | null>(null)

  const [roomName, setRoomName] = useState<string | null>(null)

  const clearError = useCallback((): void => setError(null), [])

  const join = useCallback(
    async (request: JoinRequest, create: boolean): Promise<string | null> => {
      setError(null)
      setStatus('connecting')

      let session: Awaited<ReturnType<typeof fetchToken>>
      try {
        if (create) await createRoom(request.password, request.roomName, request.roomPassword)
        session = await fetchToken(request)
      } catch (err) {
        setError(err instanceof TokenError ? err.reason : 'server')
        setStatus('disconnected')
        return null
      }

      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: { videoCodec: 'h264', simulcast: true }
      })
      const refresh = (): void => setParticipants(listParticipants(room))

      PARTICIPANT_EVENTS.forEach((event) => room.on(event, refresh))
      room.on(RoomEvent.Reconnecting, () => setStatus('reconnecting'))
      room.on(RoomEvent.Reconnected, () => {
        setStatus('connected')
        refresh()
      })
      room.on(RoomEvent.Disconnected, (reason) => {
        // A failed connect() also lands here; the catch below reports that one.
        if (roomRef.current !== room) return
        roomRef.current = null
        setActiveRoom(null)
        setRoomName(null)
        setParticipants([])
        setStatus('disconnected')
        if (reason !== DisconnectReason.CLIENT_INITIATED) setError('connection_lost')
      })

      try {
        await room.connect(import.meta.env.VITE_LIVEKIT_URL, session.token, {
          autoSubscribe: false
        })
      } catch (err) {
        console.error('LiveKit connection failed', err)
        await room.disconnect()
        setError(navigator.onLine ? 'server' : 'offline')
        setStatus('disconnected')
        return null
      }

      roomRef.current = room
      setActiveRoom(room)
      setRoomName(session.roomName)
      refresh()
      setStatus('connected')
      return session.roomName
    },
    []
  )

  const leave = useCallback(async (): Promise<void> => {
    await roomRef.current?.disconnect()
  }, [])

  return { room: activeRoom, roomName, status, participants, error, clearError, join, leave }
}
