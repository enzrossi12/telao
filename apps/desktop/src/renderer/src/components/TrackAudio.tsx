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

  // Runs after attach, which unmutes the element: the anti-echo mute must win.
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.muted = isMuted
    audio.volume = volume
  }, [track, isMuted, volume])

  return <audio ref={audioRef} autoPlay />
}

export default TrackAudio
