import { CSSProperties } from 'react'
import { RoomParticipant } from '../hooks/useRoom'
import ParticipantTile from './ParticipantTile'

interface CameraGridProps {
  participants: RoomParticipant[]
}

function CameraGrid({ participants }: CameraGridProps): React.JSX.Element {
  const columns = Math.ceil(Math.sqrt(participants.length))
  const rows = Math.ceil(participants.length / columns)
  const layout = { '--columns': columns, '--rows': rows } as CSSProperties

  return (
    <section className="camera-grid" style={layout}>
      {participants.map((participant) => (
        <ParticipantTile key={participant.identity} participant={participant} />
      ))}
    </section>
  )
}

export default CameraGrid
