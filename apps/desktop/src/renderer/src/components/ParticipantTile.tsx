import { useEffect, useRef } from 'react'
import { VideoTrack } from 'livekit-client'
import { RoomParticipant } from '../hooks/useRoom'

interface CameraVideoProps {
  track: VideoTrack
  isMirrored: boolean
}

function CameraVideo({ track, isMirrored }: CameraVideoProps): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    track.attach(video)
    return () => {
      track.detach(video)
    }
  }, [track])

  return (
    <video
      ref={videoRef}
      className={isMirrored ? 'tile-video tile-video-mirrored' : 'tile-video'}
      autoPlay
      muted
      playsInline
    />
  )
}

interface ParticipantTileProps {
  participant: RoomParticipant
}

function ParticipantTile({ participant }: ParticipantTileProps): React.JSX.Element {
  const { name, isLocal, isCameraOn, cameraTrack } = participant

  return (
    <article className="tile">
      {isCameraOn && cameraTrack ? (
        <CameraVideo track={cameraTrack} isMirrored={isLocal} />
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
