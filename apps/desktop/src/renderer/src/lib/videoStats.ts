import { VideoTrack } from 'livekit-client'

export interface VideoStats {
  width: number
  height: number
  fps: number
  bytes: number
  codec: string
  implementation: string
}

interface RtpStats {
  type: string
  kind?: string
  frameWidth?: number
  frameHeight?: number
  framesPerSecond?: number
  bytesSent?: number
  bytesReceived?: number
  codecId?: string
  encoderImplementation?: string
  decoderImplementation?: string
  mimeType?: string
}

// A simulcast sender has one outbound entry per layer: size comes from the largest, bytes from all.
export async function readVideoStats(track: VideoTrack): Promise<VideoStats | null> {
  const report = await track.getRTCStatsReport()
  if (!report) return null

  const streams = ([...report.values()] as RtpStats[]).filter(
    ({ type, kind }) => (type === 'inbound-rtp' || type === 'outbound-rtp') && kind === 'video'
  )
  if (streams.length === 0) return null

  const largest = streams.reduce((a, b) => ((b.frameWidth ?? 0) > (a.frameWidth ?? 0) ? b : a))
  const codec = largest.codecId ? (report.get(largest.codecId) as RtpStats | undefined) : undefined

  return {
    width: largest.frameWidth ?? 0,
    height: largest.frameHeight ?? 0,
    fps: largest.framesPerSecond ?? 0,
    bytes: streams.reduce((sum, s) => sum + (s.bytesSent ?? s.bytesReceived ?? 0), 0),
    codec: codec?.mimeType?.replace('video/', '') ?? '?',
    implementation: largest.encoderImplementation ?? largest.decoderImplementation ?? '?'
  }
}
