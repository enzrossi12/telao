import { useCallback, useRef, useState } from 'react'
import { DisconnectReason, Participant, Room, RoomEvent, Track, VideoTrack } from 'livekit-client'
import { fetchToken, JoinError, TokenError } from '../lib/token'

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
}

interface UseRoom {
  room: Room | null
  status: ConnectionStatus
  participants: RoomParticipant[]
  error: JoinError | null
  join: (name: string, password: string) => Promise<boolean>
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
    isWatchingScreen: isLocal ? Boolean(screen) : (screen?.isSubscribed ?? false)
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

  const join = useCallback(async (name: string, password: string): Promise<boolean> => {
    setError(null)
    setStatus('connecting')

    let token: string
    try {
      token = await fetchToken(name, password)
    } catch (err) {
      setError(err instanceof TokenError ? err.reason : 'server')
      setStatus('disconnected')
      return false
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
      setParticipants([])
      setStatus('disconnected')
      if (reason !== DisconnectReason.CLIENT_INITIATED) setError('connection_lost')
    })

    try {
      await room.connect(import.meta.env.VITE_LIVEKIT_URL, token, { autoSubscribe: false })
    } catch (err) {
      console.error('LiveKit connection failed', err)
      await room.disconnect()
      setError(navigator.onLine ? 'server' : 'offline')
      setStatus('disconnected')
      return false
    }

    roomRef.current = room
    setActiveRoom(room)
    refresh()
    setStatus('connected')
    return true
  }, [])

  const leave = useCallback(async (): Promise<void> => {
    await roomRef.current?.disconnect()
  }, [])

  return { room: activeRoom, status, participants, error, join, leave }
}
