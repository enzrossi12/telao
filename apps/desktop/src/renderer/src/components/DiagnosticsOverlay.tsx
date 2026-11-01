import { useEffect, useRef, useState } from 'react'
import { RoomParticipant } from '../hooks/useRoom'
import { readVideoStats, VideoStats } from '../lib/videoStats'

const REFRESH_INTERVAL_MS = 1000

interface DiagnosticsRow {
  identity: string
  label: string
  stats: VideoStats | null
  kbps: number
}

interface DiagnosticsOverlayProps {
  participants: RoomParticipant[]
}

function DiagnosticsOverlay({ participants }: DiagnosticsOverlayProps): React.JSX.Element {
  const [rows, setRows] = useState<DiagnosticsRow[]>([])
  const previousRef = useRef(new Map<string, { bytes: number; time: number }>())

  useEffect(() => {
    const measure = async (): Promise<void> => {
      const measured = await Promise.all(
        participants.flatMap(({ identity, name, isLocal, screenTrack }) => {
          if (!screenTrack) return []
          return readVideoStats(screenTrack).then((stats) => {
            const time = performance.now()
            const previous = previousRef.current.get(identity)
            const bytes = stats?.bytes ?? 0
            const deltaBits = (bytes - (previous?.bytes ?? bytes)) * 8
            const seconds = previous ? (time - previous.time) / 1000 : 1
            previousRef.current.set(identity, { bytes, time })
            return {
              identity,
              label: isLocal ? 'Enviando' : name,
              stats,
              kbps: Math.max(0, Math.round(deltaBits / seconds / 1000))
            }
          })
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
      {rows.map(({ identity, label, stats, kbps }) => (
        <dl key={identity}>
          <dt>{label}</dt>
          {stats ? (
            <dd>
              {stats.width}×{stats.height} · {Math.round(stats.fps)} fps · {kbps} kbps ·{' '}
              {stats.codec} · {stats.implementation}
            </dd>
          ) : (
            <dd>Aguardando dados…</dd>
          )}
        </dl>
      ))}
    </aside>
  )
}

export default DiagnosticsOverlay
