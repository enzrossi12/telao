const SAMPLE_RATE = 48000
const CHANNELS = 2
const BYTES_PER_FRAME = 2 * CHANNELS
const FILL_INTERVAL_MS = 20
const MAX_GAP_FRAMES = (SAMPLE_RATE * 60) / 1000

export interface ScreenAudioSource {
  track: MediaStreamTrack
  stop: () => void
}

interface PcmWriter {
  write: (chunk: Uint8Array<ArrayBuffer>) => void
  stop: () => void
}

// The capture drops silent buffers, but WebRTC counts time by samples received: a gap puts the
// track behind the clock and the viewer's jitter buffer grows to match (about 500 ms measured for
// one second pauses). Writing zeros in those gaps keeps the track continuous.
export function createPcmWriter(writer: WritableStreamDefaultWriter<AudioData>): PcmWriter {
  const startedAt = performance.now()
  let writtenFrames = 0

  const write = (chunk: Uint8Array<ArrayBuffer>): void => {
    const numberOfFrames = chunk.byteLength / BYTES_PER_FRAME
    writtenFrames += numberOfFrames
    writer.write(
      new AudioData({
        format: 's16',
        sampleRate: SAMPLE_RATE,
        numberOfChannels: CHANNELS,
        numberOfFrames,
        timestamp: performance.now() * 1000,
        data: chunk
      })
    )
  }

  const timer = setInterval(() => {
    const expectedFrames = ((performance.now() - startedAt) * SAMPLE_RATE) / 1000
    const missingFrames = Math.floor(expectedFrames - writtenFrames)
    if (missingFrames >= MAX_GAP_FRAMES) write(new Uint8Array(missingFrames * BYTES_PER_FRAME))
  }, FILL_INTERVAL_MS)

  return { write, stop: () => clearInterval(timer) }
}

// Turns the PCM chunks captured by the main process into a track LiveKit can publish.
export async function startScreenAudio(): Promise<ScreenAudioSource> {
  const generator = new MediaStreamTrackGenerator({ kind: 'audio' })
  const pcmWriter = createPcmWriter(generator.writable.getWriter())
  const unsubscribe = window.telao.onScreenAudioChunk(pcmWriter.write)

  const stop = (): void => {
    unsubscribe()
    pcmWriter.stop()
    window.telao.stopScreenAudio()
    generator.stop()
  }

  try {
    await window.telao.startScreenAudio()
  } catch (err) {
    stop()
    throw err
  }
  return { track: generator, stop }
}
