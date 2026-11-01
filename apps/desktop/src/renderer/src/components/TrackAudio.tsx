import { useEffect, useRef } from 'react'
import { AudioTrack } from 'livekit-client'

interface TrackAudioProps {
  track: AudioTrack
  volume: number
  isMuted: boolean
}

function TrackAudio({ track, volume, isMuted }: TrackAudioProps): React.JSX.Element {
  const audioRef = useRef<HTMLAudioElement>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    track.attach(audio)
    return () => {
      track.detach(audio)
    }
  }, [track])

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  return <audio ref={audioRef} autoPlay muted={isMuted} />
}

export default TrackAudio
