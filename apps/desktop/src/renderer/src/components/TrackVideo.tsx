import { useEffect, useRef } from 'react'
import { VideoTrack } from 'livekit-client'

interface TrackVideoProps {
  track: VideoTrack
  className: string
}

function TrackVideo({ track, className }: TrackVideoProps): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    track.attach(video)
    return () => {
      track.detach(video)
    }
  }, [track])

  return <video ref={videoRef} className={className} autoPlay muted playsInline />
}

export default TrackVideo
