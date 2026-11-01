const SAMPLE_RATE = 48000
const CHANNELS = 2
const BYTES_PER_FRAME = 2 * CHANNELS

export interface ScreenAudioSource {
  track: MediaStreamTrack
  stop: () => void
}

// Turns the PCM chunks captured by the main process into a track LiveKit can publish.
export async function startScreenAudio(): Promise<ScreenAudioSource> {
  const generator = new MediaStreamTrackGenerator({ kind: 'audio' })
  const writer = generator.writable.getWriter()

  const unsubscribe = window.telao.onScreenAudioChunk((chunk) => {
    writer.write(
      new AudioData({
        format: 's16',
        sampleRate: SAMPLE_RATE,
        numberOfChannels: CHANNELS,
        numberOfFrames: chunk.byteLength / BYTES_PER_FRAME,
        timestamp: performance.now() * 1000,
        data: chunk
      })
    )
  })

  const stop = (): void => {
    unsubscribe()
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
