import { useEffect, useState } from 'react'
import { LogOut } from 'lucide-react'
import { Room } from 'livekit-client'
import { useCamera } from '../hooks/useCamera'
import { RoomParticipant } from '../hooks/useRoom'
import { useScreenShare } from '../hooks/useScreenShare'
import CameraControl from './CameraControl'
import DiagnosticsOverlay from './DiagnosticsOverlay'
import ParticipantList from './ParticipantList'
import ScreenShareControl from './ScreenShareControl'
import Stage from './Stage'

interface RoomScreenProps {
  room: Room | null
  participants: RoomParticipant[]
  isReconnecting: boolean
  onLeave: () => void
}

function RoomScreen({
  room,
  participants,
  isReconnecting,
  onLeave
}: RoomScreenProps): React.JSX.Element {
  const camera = useCamera(room)
  const screenShare = useScreenShare(room)
  const [showDiagnostics, setShowDiagnostics] = useState(false)
  const localParticipant = participants.find(({ isLocal }) => isLocal)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyD') {
        setShowDiagnostics((visible) => !visible)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="room">
      <ParticipantList participants={participants} />
      <main className="stage">
        {isReconnecting && (
          <p className="connection-banner" role="status">
            Reconectando…
          </p>
        )}
        <Stage participants={participants} onSetWatching={screenShare.setWatching} />
        {showDiagnostics && <DiagnosticsOverlay participants={participants} />}
        <footer className="toolbar">
          <CameraControl camera={camera} isCameraOn={localParticipant?.isCameraOn ?? false} />
          <ScreenShareControl
            screenShare={screenShare}
            isSharing={localParticipant?.isLive ?? false}
          />
          <button type="button" className="leave-button" onClick={onLeave}>
            <LogOut size={18} />
            Sair
          </button>
        </footer>
      </main>
    </div>
  )
}

export default RoomScreen
