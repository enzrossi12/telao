import { RoomParticipant } from '../hooks/useRoom'
import ParticipantList from './ParticipantList'

interface RoomScreenProps {
  participants: RoomParticipant[]
  isReconnecting: boolean
  onLeave: () => void
}

function RoomScreen({ participants, isReconnecting, onLeave }: RoomScreenProps): React.JSX.Element {
  return (
    <div className="room">
      <ParticipantList participants={participants} />
      <main className="stage">
        {isReconnecting && (
          <p className="connection-banner" role="status">
            Reconectando…
          </p>
        )}
        <div className="stage-empty">Ninguém está compartilhando a tela.</div>
        <footer className="toolbar">
          <button type="button" className="leave-button" onClick={onLeave}>
            Sair
          </button>
        </footer>
      </main>
    </div>
  )
}

export default RoomScreen
