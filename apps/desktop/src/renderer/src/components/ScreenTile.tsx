import { ReactNode } from 'react'
import { Maximize } from 'lucide-react'
import { RoomParticipant } from '../hooks/useRoom'
import IconButton from './IconButton'
import Spinner from './Spinner'
import StopWatchingButton from './StopWatchingButton'
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
      {isWatchingScreen && !screenTrack && (
        <span className="tile-status">
          <Spinner />
          Conectando…
        </span>
      )}
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
      <span className="live-badge tile-badge">Ao vivo</span>
      <span className="tile-name">{isLocal ? 'Sua tela' : `Tela de ${name}`}</span>
      {isWatchingScreen && screenTrack && (
        <div className="stream-badge">
          <IconButton label="Tela cheia" icon={<Maximize size={16} />} onClick={onFullscreen} />
        </div>
      )}
      {isWatchingScreen && !isLocal && <StopWatchingButton onClick={onStopWatching} />}
      {isWatchingScreen && volumeControl && (
        <div className="stream-control stream-volume">{volumeControl}</div>
      )}
    </article>
  )
}

export default ScreenTile
