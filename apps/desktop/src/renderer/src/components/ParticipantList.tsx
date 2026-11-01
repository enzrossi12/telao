import { RoomParticipant } from '../hooks/useRoom'

interface ParticipantListProps {
  participants: RoomParticipant[]
}

function CameraIcon(): React.JSX.Element {
  return (
    <svg className="participant-camera" viewBox="0 0 24 24" role="img" aria-label="Câmera ligada">
      <rect x="3" y="6" width="13" height="12" rx="2" fill="currentColor" />
      <path d="M17 10.5 21 8v8l-4-2.5z" fill="currentColor" />
    </svg>
  )
}

function ParticipantList({ participants }: ParticipantListProps): React.JSX.Element {
  return (
    <aside className="sidebar">
      <h2>Na sala — {participants.length}</h2>
      <ul>
        {participants.map((participant) => (
          <li key={participant.identity} className="participant">
            <span className="participant-avatar" aria-hidden="true">
              {participant.name.charAt(0).toUpperCase()}
            </span>
            <span className="participant-name">
              {participant.name}
              {participant.isLocal && ' (você)'}
            </span>
            {participant.isCameraOn && <CameraIcon />}
            {participant.isLive && <span className="live-badge">AO VIVO</span>}
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default ParticipantList
