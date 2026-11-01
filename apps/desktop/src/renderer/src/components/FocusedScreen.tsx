import { ReactNode, useEffect, useRef } from 'react'
import { VideoTrack } from 'livekit-client'
import { RoomParticipant } from '../hooks/useRoom'
import TrackVideo from './TrackVideo'

interface FocusedScreenProps {
  participant: RoomParticipant
  track: VideoTrack
  volumeControl: ReactNode
  onExit: () => void
  onStopWatching: () => void
}

function FocusedScreen({
  participant,
  track,
  volumeControl,
  onExit,
  onStopWatching
}: FocusedScreenProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const { name, isLocal } = participant

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && document.fullscreenElement) document.exitFullscreen()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // HTML fullscreen also takes the Electron window to full screen.
  const toggleFullscreen = (): void => {
    if (document.fullscreenElement) document.exitFullscreen()
    else containerRef.current?.requestFullscreen()
  }

  return (
    <div ref={containerRef} className="focused-screen" onDoubleClick={toggleFullscreen}>
      <TrackVideo track={track} className="focused-video" />
      <span className="live-badge tile-badge">AO VIVO</span>
      <span className="tile-name">{isLocal ? 'Sua tela' : `Tela de ${name}`}</span>
      <div className="focused-actions" onDoubleClick={(event) => event.stopPropagation()}>
        {volumeControl}
        <button type="button" className="tile-action-inline" onClick={onExit}>
          Sair do destaque
        </button>
        {!isLocal && (
          <button type="button" className="tile-action-inline" onClick={onStopWatching}>
            Parar de assistir
          </button>
        )}
      </div>
    </div>
  )
}

export default FocusedScreen
