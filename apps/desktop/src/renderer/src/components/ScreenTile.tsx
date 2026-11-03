import { ReactNode } from 'react'
import { EyeOff, Maximize } from 'lucide-react'
import { RoomParticipant } from '../hooks/useRoom'
import IconButton from './IconButton'
import TrackVideo from './TrackVideo'

interface ScreenTileProps {
  participant: RoomParticipant
  volumeControl: ReactNode
  onWatch: () => void
  onStopWatching: () => void
  onFocus: () => void
  onFullscreen: () => void
}

function ScreenTile({
  participant,
  volumeControl,
  onWatch,
  onStopWatching,
  onFocus,
  onFullscreen
}: ScreenTileProps): React.JSX.Element {
  const { name, isLocal, isWatchingScreen, screenTrack } = participant

  return (
    <article className="tile tile-screen">
      {!isWatchingScreen && (
        <button type="button" className="watch-button" onClick={onWatch}>
          Assistir
        </button>
      )}
      {isWatchingScreen && !screenTrack && <span className="tile-status">Conectando…</span>}
      {isWatchingScreen && screenTrack && (
        <button
          type="button"
          className="tile-focus-button"
          aria-label={`Destacar a tela de ${name}`}
          onClick={onFocus}
        >
          <TrackVideo track={screenTrack} className="tile-video tile-video-screen" />
        </button>
      )}
      <span className="live-badge tile-badge">AO VIVO</span>
      <span className="tile-name">{isLocal ? 'Sua tela' : `Tela de ${name}`}</span>
      {isWatchingScreen && (
        <div className="stream-badge">
          {volumeControl}
          {screenTrack && (
            <IconButton label="Tela cheia" icon={<Maximize size={16} />} onClick={onFullscreen} />
          )}
          {!isLocal && (
            <IconButton
              label="Parar de assistir"
              icon={<EyeOff size={16} />}
              onClick={onStopWatching}
            />
          )}
        </div>
      )}
    </article>
  )
}

export default ScreenTile
