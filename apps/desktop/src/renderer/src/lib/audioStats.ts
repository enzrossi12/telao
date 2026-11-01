import { AudioTrack } from 'livekit-client'

export interface AudioStats {
  bytes: number
  level: number | null
  codec: string
  playback: string | null
  output: string | null
}

interface RtpStats {
  type: string
  kind?: string
  bytesSent?: number
  bytesReceived?: number
  audioLevel?: number
  codecId?: string
  mimeType?: string
}

function describePlayback(element: HTMLMediaElement | undefined): string | null {
  if (!element) return null
  const state = element.paused ? 'pausado' : 'tocando'
  return `${state}${element.muted ? ', mudo' : ''}, volume ${Math.round(element.volume * 100)}%`
}

async function findDefaultOutput(): Promise<string | null> {
  const devices = await navigator.mediaDevices.enumerateDevices()
  const output = devices.find(
    ({ kind, deviceId }) => kind === 'audiooutput' && deviceId === 'default'
  )
  return output?.label || null
}

export async function readAudioStats(track: AudioTrack): Promise<AudioStats | null> {
  const report = await track.getRTCStatsReport()
  if (!report) return null

  const stream = ([...report.values()] as RtpStats[]).find(
    ({ type, kind }) => (type === 'inbound-rtp' || type === 'outbound-rtp') && kind === 'audio'
  )
  if (!stream) return null

  const element = track.attachedElements[0]
  const codec = stream.codecId ? (report.get(stream.codecId) as RtpStats | undefined) : undefined

  return {
    bytes: stream.bytesSent ?? stream.bytesReceived ?? 0,
    level: stream.audioLevel ?? null,
    codec: codec?.mimeType?.replace('audio/', '') ?? '?',
    playback: describePlayback(element),
    output: element ? await findDefaultOutput() : null
  }
}
