import { RoomParticipant } from '../hooks/useRoom'
import TrackVideo from './TrackVideo'

interface ParticipantTileProps {
  participant: RoomParticipant
}

function ParticipantTile({ participant }: ParticipantTileProps): React.JSX.Element {
  const { name, isLocal, isCameraOn, cameraTrack } = participant

  return (
    <article className="tile">
      {isCameraOn && cameraTrack ? (
        <TrackVideo
          track={cameraTrack}
          className={isLocal ? 'tile-video tile-video-mirrored' : 'tile-video'}
        />
      ) : (
        <span className="tile-avatar" aria-hidden="true">
          {name.charAt(0).toUpperCase()}
        </span>
      )}
      <span className="tile-name">
        {name}
        {isLocal && ' (você)'}
      </span>
    </article>
  )
}

export default ParticipantTile
