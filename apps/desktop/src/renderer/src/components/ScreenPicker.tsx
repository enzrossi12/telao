import { useEffect, useState } from 'react'
import { ScreenSource } from '../../../shared/ipc'

const TABS: { kind: ScreenSource['kind']; label: string }[] = [
  { kind: 'window', label: 'Aplicativos' },
  { kind: 'screen', label: 'Telas' }
]

interface ScreenPickerProps {
  onPick: (sourceId: string, withAudio: boolean) => void
  onCancel: () => void
}

function ScreenPicker({ onPick, onCancel }: ScreenPickerProps): React.JSX.Element {
  const [sources, setSources] = useState<ScreenSource[] | null>(null)
  const [activeKind, setActiveKind] = useState<ScreenSource['kind']>('window')
  const [isAudioSupported, setIsAudioSupported] = useState(true)
  const [withAudio, setWithAudio] = useState(false)

  useEffect(() => {
    window.telao.listScreenSources().then(setSources)
    window.telao.isScreenAudioSupported().then(setIsAudioSupported)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const visibleSources = sources?.filter(({ kind }) => kind === activeKind)

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <section
        className="screen-picker"
        role="dialog"
        aria-modal="true"
        aria-label="Compartilhar tela"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="screen-picker-header">
          <h2>Compartilhar tela</h2>
          <button type="button" className="modal-close" aria-label="Fechar" onClick={onCancel}>
            ×
          </button>
        </header>

        <div className="screen-picker-tabs" role="tablist">
          {TABS.map(({ kind, label }) => (
            <button
              key={kind}
              type="button"
              role="tab"
              aria-selected={kind === activeKind}
              className={kind === activeKind ? 'picker-tab picker-tab-active' : 'picker-tab'}
              onClick={() => setActiveKind(kind)}
            >
              {label}
            </button>
          ))}
        </div>

        {!visibleSources && <p className="screen-picker-message">Carregando…</p>}
        {visibleSources?.length === 0 && (
          <p className="screen-picker-message">Nada para compartilhar aqui.</p>
        )}
        <div className="screen-picker-grid">
          {visibleSources?.map((source) => (
            <button
              key={source.id}
              type="button"
              className="screen-source"
              onClick={() => onPick(source.id, isAudioSupported && withAudio)}
            >
              <img src={source.thumbnailDataUrl} alt="" />
              <span className="screen-source-name">
                {source.iconDataUrl && <img src={source.iconDataUrl} alt="" />}
                <span>{source.name}</span>
              </span>
            </button>
          ))}
        </div>

        <footer className="screen-picker-footer">
          <label>
            <input
              type="checkbox"
              checked={isAudioSupported && withAudio}
              disabled={!isAudioSupported}
              onChange={(event) => setWithAudio(event.target.checked)}
            />
            Compartilhar som (sem o Discord)
          </label>
          {!isAudioSupported && (
            <p>Compartilhar som exige Windows 11, para o som do Discord não ir junto.</p>
          )}
        </footer>
      </section>
    </div>
  )
}

export default ScreenPicker
