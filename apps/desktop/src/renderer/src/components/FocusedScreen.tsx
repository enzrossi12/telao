import { ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { Maximize, Minimize, Minimize2 } from 'lucide-react'
import { VideoTrack } from 'livekit-client'
import { RoomParticipant } from '../hooks/useRoom'
import IconButton from './IconButton'
import StopWatchingButton from './StopWatchingButton'
import TrackVideo from './TrackVideo'

const IDLE_TIMEOUT_MS = 2500

interface FocusedScreenProps {
  participant: RoomParticipant
  track: VideoTrack
  volumeControl: ReactNode
  startFullscreen: boolean
  onExit: () => void
  onStopWatching: () => void
}

function FocusedScreen({
  participant,
  track,
  volumeControl,
  startFullscreen,
  onExit,
  onStopWatching
}: FocusedScreenProps): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isIdle, setIsIdle] = useState(false)
  const { name, isLocal } = participant

  // In full screen the controls and the cursor leave the video alone until the mouse moves.
  const wake = useCallback((): void => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    setIsIdle(false)
    if (document.fullscreenElement) {
      idleTimerRef.current = setTimeout(() => setIsIdle(true), IDLE_TIMEOUT_MS)
    }
  }, [])

  useEffect(() => {
    const handleFullscreenChange = (): void => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
      wake()
    }
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape' && document.fullscreenElement) document.exitFullscreen()
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      window.removeEventListener('keydown', handleKeyDown)
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    }
  }, [wake])

  useEffect(() => {
    if (startFullscreen) containerRef.current?.requestFullscreen()
  }, [startFullscreen])

  // HTML fullscreen also takes the Electron window to full screen.
  const toggleFullscreen = (): void => {
    if (document.fullscreenElement) document.exitFullscreen()
    else containerRef.current?.requestFullscreen()
  }

  return (
    <div
      ref={containerRef}
      className={isIdle ? 'focused-screen focused-screen-idle' : 'focused-screen'}
      onDoubleClick={toggleFullscreen}
      onMouseMove={wake}
    >
      <TrackVideo track={track} className="focused-video" />
      <span className="live-badge tile-badge">Ao vivo</span>
      <span className="tile-name">{isLocal ? 'Sua tela' : `Tela de ${name}`}</span>
      <div className="stream-badge" onDoubleClick={(event) => event.stopPropagation()}>
        <IconButton
          label={isFullscreen ? 'Sair da tela cheia' : 'Tela cheia'}
          icon={isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          onClick={toggleFullscreen}
        />
        <IconButton label="Sair do destaque" icon={<Minimize2 size={16} />} onClick={onExit} />
      </div>
      {!isLocal && <StopWatchingButton onClick={onStopWatching} />}
      {volumeControl && <div className="stream-control stream-volume">{volumeControl}</div>}
    </div>
  )
}

export default FocusedScreen
