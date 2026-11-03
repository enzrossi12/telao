import { useEffect, useState } from 'react'
import { ScreenAudioSupport, ScreenSource } from '../../../shared/ipc'

const TABS: { kind: ScreenSource['kind']; label: string }[] = [
  { kind: 'window', label: 'Aplicativos' },
  { kind: 'screen', label: 'Telas' }
]

const SKELETON_COUNT = 6

interface ScreenPickerProps {
  onPick: (sourceId: string, withAudio: boolean) => void
  onCancel: () => void
}

function ScreenPicker({ onPick, onCancel }: ScreenPickerProps): React.JSX.Element {
  const [sources, setSources] = useState<ScreenSource[] | null>(null)
  const [activeKind, setActiveKind] = useState<ScreenSource['kind']>('window')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [audioSupport, setAudioSupport] = useState<ScreenAudioSupport>('full')
  const [withAudio, setWithAudio] = useState(false)
  const isAudioSupported = audioSupport !== 'none'

  useEffect(() => {
    window.telao.listScreenSources().then(setSources)
    window.telao.getScreenAudioSupport().then(setAudioSupport)
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onCancel])

  const visibleSources = sources?.filter(({ kind }) => kind === activeKind)
  // A choice left behind in the other tab is off screen, so it must not be what gets shared.
  const selectedSource = visibleSources?.find(({ id }) => id === selectedId)

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

        {visibleSources?.length === 0 && (
          <p className="screen-picker-message">Nada para compartilhar aqui.</p>
        )}
        <div className="screen-picker-grid" aria-busy={!visibleSources}>
          {!visibleSources &&
            Array.from({ length: SKELETON_COUNT }, (_, index) => (
              <div key={index} className="screen-source screen-source-skeleton" aria-hidden="true">
                <span className="skeleton skeleton-thumbnail" />
                <span className="skeleton skeleton-line" />
              </div>
            ))}
          {visibleSources?.map((source) => (
            <button
              key={source.id}
              type="button"
              className={
                source.id === selectedId ? 'screen-source screen-source-selected' : 'screen-source'
              }
              aria-pressed={source.id === selectedId}
              onClick={() => setSelectedId(source.id)}
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
          <div className="screen-picker-options">
            <label>
              <input
                type="checkbox"
                checked={isAudioSupported && withAudio}
                disabled={!isAudioSupported}
                onChange={(event) => setWithAudio(event.target.checked)}
              />
              Compartilhar som (sem o Discord)
            </label>
            {audioSupport === 'experimental' && (
              <p>
                No Windows 10 isso é experimental: confirme com quem assiste se o Discord ficou de
                fora.
              </p>
            )}
            {audioSupport === 'none' && (
              <p>
                Compartilhar som exige Windows 10 versão 2004 ou mais novo, para o som do Discord
                não ir junto.
              </p>
            )}
          </div>
          <button
            type="button"
            className="screen-picker-confirm"
            disabled={!selectedSource}
            onClick={() =>
              selectedSource && onPick(selectedSource.id, isAudioSupported && withAudio)
            }
          >
            Compartilhar
          </button>
        </footer>
      </section>
    </div>
  )
}

export default ScreenPicker
