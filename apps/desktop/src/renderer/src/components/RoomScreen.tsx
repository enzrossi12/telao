import { Room } from 'livekit-client'
import { useCamera } from '../hooks/useCamera'
import { RoomParticipant } from '../hooks/useRoom'
import CameraControl from './CameraControl'
import CameraGrid from './CameraGrid'
import ParticipantList from './ParticipantList'

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
  const isCameraOn = participants.some(({ isLocal, isCameraOn }) => isLocal && isCameraOn)

  return (
    <div className="room">
      <ParticipantList participants={participants} />
      <main className="stage">
        {isReconnecting && (
          <p className="connection-banner" role="status">
            Reconectando…
          </p>
        )}
        <CameraGrid participants={participants} />
        <footer className="toolbar">
          <CameraControl camera={camera} isCameraOn={isCameraOn} />
          <button type="button" className="leave-button" onClick={onLeave}>
            Sair
          </button>
        </footer>
      </main>
    </div>
  )
}

export default RoomScreen
