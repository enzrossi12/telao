import { useEffect, useRef, useState } from 'react'
import { VideoTrack } from 'livekit-client'
import Spinner from './Spinner'

interface TrackVideoProps {
  track: VideoTrack
  className: string
}

function TrackVideo({ track, className }: TrackVideoProps): React.JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Tied to the track, so a new track shows the loader again until its first frame.
  const [readyTrack, setReadyTrack] = useState<VideoTrack | null>(null)
  const isReady = readyTrack === track

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    const handleLoadedData = (): void => setReadyTrack(track)
    video.addEventListener('loadeddata', handleLoadedData)
    track.attach(video)
    return () => {
      video.removeEventListener('loadeddata', handleLoadedData)
      track.detach(video)
    }
  }, [track])

  return (
    <>
      <video
        ref={videoRef}
        className={
          isReady ? `${className} track-video track-video-ready` : `${className} track-video`
        }
        autoPlay
        muted
        playsInline
      />
      {!isReady && (
        <span className="video-loader">
          <Spinner />
        </span>
      )}
    </>
  )
}

export default TrackVideo
