import { useState } from 'react'
import { RoomParticipant } from '../hooks/useRoom'
import FocusedScreen from './FocusedScreen'
import ParticipantTile from './ParticipantTile'
import ScreenTile from './ScreenTile'
import TileGrid from './TileGrid'
import TrackAudio from './TrackAudio'
import VolumeSlider from './VolumeSlider'

const DEFAULT_VOLUME = 1

interface StageProps {
  participants: RoomParticipant[]
  onSetWatching: (identity: string, watching: boolean) => void
}

function Stage({ participants, onSetWatching }: StageProps): React.JSX.Element {
  const [focusedIdentity, setFocusedIdentity] = useState<string | null>(null)
  const [volumes, setVolumes] = useState<Record<string, number>>({})

  // Derived, so focus ends by itself when the stream stops or the viewer stops watching.
  const screens = participants.filter(({ isLive }) => isLive)
  const focused = screens.find(
    ({ identity, isWatchingScreen }) => identity === focusedIdentity && isWatchingScreen
  )
  const focusedTrack = focused?.screenTrack

  const isSharingSound = participants.some(
    ({ isLocal, screenAudioTrack }) => isLocal && screenAudioTrack
  )
  const remoteSounds = screens.filter(
    ({ isLocal, screenAudioTrack }) => !isLocal && screenAudioTrack
  )

  const volumeOf = (identity: string): number => volumes[identity] ?? DEFAULT_VOLUME

  const renderVolume = ({ identity, name, isLocal, screenAudioTrack }: RoomParticipant) =>
    !isLocal &&
    screenAudioTrack && (
      <VolumeSlider
        name={name}
        volume={volumeOf(identity)}
        onChange={(volume) => setVolumes((current) => ({ ...current, [identity]: volume }))}
      />
    )

  const tiles = [
    ...screens
      .filter((participant) => participant !== focused)
      .map((participant) => (
        <ScreenTile
          key={`screen-${participant.identity}`}
          participant={participant}
          volumeControl={renderVolume(participant)}
          onWatch={() => onSetWatching(participant.identity, true)}
          onStopWatching={() => onSetWatching(participant.identity, false)}
          onFocus={() => setFocusedIdentity(participant.identity)}
        />
      )),
    ...participants.map((participant) => (
      <ParticipantTile key={`camera-${participant.identity}`} participant={participant} />
    ))
  ]

  return (
    <>
      {remoteSounds.map(
        ({ identity, screenAudioTrack }) =>
          screenAudioTrack && (
            <TrackAudio
              key={identity}
              track={screenAudioTrack}
              volume={volumeOf(identity)}
              isMuted={Boolean(isSharingSound)}
            />
          )
      )}
      {isSharingSound && (
        <p className="sound-notice" role="status">
          Seu som está sendo compartilhado, sem o Discord. O som de quem você assiste fica mudo para
          evitar eco.
        </p>
      )}
      {focused && focusedTrack ? (
        <section className="focus-layout">
          <FocusedScreen
            participant={focused}
            track={focusedTrack}
            volumeControl={renderVolume(focused)}
            onExit={() => setFocusedIdentity(null)}
            onStopWatching={() => onSetWatching(focused.identity, false)}
          />
          <div className="tile-strip">{tiles}</div>
        </section>
      ) : (
        <TileGrid>{tiles}</TileGrid>
      )}
    </>
  )
}

export default Stage
