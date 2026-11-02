import { AudioTrack } from 'livekit-client'

export interface AudioStats {
  bytes: number
  level: number | null
  codec: string
  bufferMs: number | null
  concealedPercent: number | null
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
  jitterBufferDelay?: number
  jitterBufferEmittedCount?: number
  concealedSamples?: number
  totalSamplesReceived?: number
}

// Session totals would hide a recent change, so each reading compares against the last one.
const lastReadings = new WeakMap<AudioTrack, RtpStats>()

function recentBufferMs(current: RtpStats, last: RtpStats | undefined): number | null {
  const emitted = (current.jitterBufferEmittedCount ?? 0) - (last?.jitterBufferEmittedCount ?? 0)
  if (emitted <= 0) return null
  const delay = (current.jitterBufferDelay ?? 0) - (last?.jitterBufferDelay ?? 0)
  return Math.round((delay / emitted) * 1000)
}

function recentConcealedPercent(current: RtpStats, last: RtpStats | undefined): number | null {
  const samples = (current.totalSamplesReceived ?? 0) - (last?.totalSamplesReceived ?? 0)
  if (samples <= 0) return null
  const concealed = (current.concealedSamples ?? 0) - (last?.concealedSamples ?? 0)
  return Math.round((concealed / samples) * 100)
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
  const last = lastReadings.get(track)
  lastReadings.set(track, stream)

  return {
    bytes: stream.bytesSent ?? stream.bytesReceived ?? 0,
    level: stream.audioLevel ?? null,
    codec: codec?.mimeType?.replace('audio/', '') ?? '?',
    bufferMs: recentBufferMs(stream, last),
    concealedPercent: recentConcealedPercent(stream, last),
    playback: describePlayback(element),
    output: element ? await findDefaultOutput() : null
  }
}
