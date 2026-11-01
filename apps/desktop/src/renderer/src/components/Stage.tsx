import { useState } from 'react'
import { RoomParticipant } from '../hooks/useRoom'
import FocusedScreen from './FocusedScreen'
import ParticipantTile from './ParticipantTile'
import ScreenTile from './ScreenTile'
import TileGrid from './TileGrid'

interface StageProps {
  participants: RoomParticipant[]
  onSetWatching: (identity: string, watching: boolean) => void
}

function Stage({ participants, onSetWatching }: StageProps): React.JSX.Element {
  const [focusedIdentity, setFocusedIdentity] = useState<string | null>(null)

  // Derived, so focus ends by itself when the stream stops or the viewer stops watching.
  const screens = participants.filter(({ isLive }) => isLive)
  const focused = screens.find(
    ({ identity, isWatchingScreen }) => identity === focusedIdentity && isWatchingScreen
  )
  const focusedTrack = focused?.screenTrack

  const tiles = [
    ...screens
      .filter((participant) => participant !== focused)
      .map((participant) => (
        <ScreenTile
          key={`screen-${participant.identity}`}
          participant={participant}
          onWatch={() => onSetWatching(participant.identity, true)}
          onStopWatching={() => onSetWatching(participant.identity, false)}
          onFocus={() => setFocusedIdentity(participant.identity)}
        />
      )),
    ...participants.map((participant) => (
      <ParticipantTile key={`camera-${participant.identity}`} participant={participant} />
    ))
  ]

  if (!focused || !focusedTrack) return <TileGrid>{tiles}</TileGrid>

  return (
    <section className="focus-layout">
      <FocusedScreen
        participant={focused}
        track={focusedTrack}
        onExit={() => setFocusedIdentity(null)}
        onStopWatching={() => onSetWatching(focused.identity, false)}
      />
      <div className="tile-strip">{tiles}</div>
    </section>
  )
}

export default Stage
