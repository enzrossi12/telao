import { useEffect, useRef, useState } from 'react'
import { AudioTrack, VideoTrack } from 'livekit-client'
import { RoomParticipant } from '../hooks/useRoom'
import { readAudioStats } from '../lib/audioStats'
import { readVideoStats } from '../lib/videoStats'

const REFRESH_INTERVAL_MS = 1000

interface DiagnosticsRow {
  key: string
  label: string
  detail: string
}

interface Reading {
  bytes: number
  describe: (kbps: number) => string
}

interface DiagnosticsOverlayProps {
  participants: RoomParticipant[]
}

async function readVideo(track: VideoTrack): Promise<Reading | null> {
  const stats = await readVideoStats(track)
  if (!stats) return null
  const { width, height, fps, codec, implementation } = stats
  return {
    bytes: stats.bytes,
    describe: (kbps) =>
      `${width}×${height} · ${Math.round(fps)} fps · ${kbps} kbps · ${codec} · ${implementation}`
  }
}

async function readAudio(track: AudioTrack): Promise<Reading | null> {
  const stats = await readAudioStats(track)
  if (!stats) return null
  const { codec, level, bufferMs, concealedPercent, playback, output } = stats
  return {
    bytes: stats.bytes,
    describe: (kbps) =>
      [
        `${kbps} kbps`,
        codec,
        level !== null && `nível ${level.toFixed(3)}`,
        bufferMs !== null && `atraso ${bufferMs} ms`,
        concealedPercent !== null && `perda ${concealedPercent}%`,
        playback,
        output && `saída: ${output}`
      ]
        .filter(Boolean)
        .join(' · ')
  }
}

function DiagnosticsOverlay({ participants }: DiagnosticsOverlayProps): React.JSX.Element {
  const [rows, setRows] = useState<DiagnosticsRow[]>([])
  const previousRef = useRef(new Map<string, { bytes: number; time: number }>())

  useEffect(() => {
    const measureRow = async (
      key: string,
      label: string,
      read: () => Promise<Reading | null>
    ): Promise<DiagnosticsRow> => {
      const reading = await read()
      const time = performance.now()
      const previous = previousRef.current.get(key)
      const bytes = reading?.bytes ?? 0
      const deltaBits = (bytes - (previous?.bytes ?? bytes)) * 8
      const seconds = previous ? (time - previous.time) / 1000 : 1
      previousRef.current.set(key, { bytes, time })
      const kbps = Math.max(0, Math.round(deltaBits / seconds / 1000))
      return { key, label, detail: reading?.describe(kbps) ?? 'Aguardando dados…' }
    }

    const measure = async (): Promise<void> => {
      const measured = await Promise.all(
        participants.flatMap(({ identity, name, isLocal, screenTrack, screenAudioTrack }) => {
          const label = isLocal ? 'Enviando' : name
          return [
            ...(screenTrack
              ? [measureRow(`${identity}-video`, label, () => readVideo(screenTrack))]
              : []),
            ...(screenAudioTrack
              ? [
                  measureRow(`${identity}-audio`, `${label} (som)`, () =>
                    readAudio(screenAudioTrack)
                  )
                ]
              : [])
          ]
        })
      )
      setRows(measured)
    }

    const timer = setInterval(measure, REFRESH_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [participants])

  return (
    <aside className="diagnostics" aria-label="Diagnóstico">
      <h2>Diagnóstico</h2>
      {rows.length === 0 && <p>Nenhuma tela em andamento.</p>}
      {rows.map(({ key, label, detail }) => (
        <dl key={key}>
          <dt>{label}</dt>
          <dd>{detail}</dd>
        </dl>
      ))}
    </aside>
  )
}

export default DiagnosticsOverlay
