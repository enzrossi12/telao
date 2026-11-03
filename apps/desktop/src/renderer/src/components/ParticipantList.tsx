import { Video } from 'lucide-react'
import { RoomParticipant } from '../hooks/useRoom'

interface ParticipantListProps {
  roomName: string
  participants: RoomParticipant[]
}

function ParticipantList({ roomName, participants }: ParticipantListProps): React.JSX.Element {
  return (
    <aside className="sidebar">
      <p className="brand sidebar-brand">telão</p>
      <p className="sidebar-room" title={roomName}>
        {roomName}
      </p>
      <h2>Na sala · {participants.length}</h2>
      <ul>
        {participants.map((participant) => (
          <li
            key={participant.identity}
            className={participant.isLive ? 'participant participant-live' : 'participant'}
          >
            <span className="participant-avatar" aria-hidden="true">
              {participant.name.charAt(0).toUpperCase()}
            </span>
            <span className="participant-name">
              {participant.name}
              {participant.isLocal && ' (você)'}
            </span>
            {participant.isCameraOn && (
              <Video className="participant-camera" size={16} aria-label="Câmera ligada" />
            )}
            {participant.isLive && <span className="live-badge">Ao vivo</span>}
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default ParticipantList
