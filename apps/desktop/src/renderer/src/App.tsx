import { useEffect, useState } from 'react'
import { SavedCredentials } from '../../shared/ipc'
import LoginScreen from './components/LoginScreen'
import RoomScreen from './components/RoomScreen'
import { useRoom } from './hooks/useRoom'

function App(): React.JSX.Element | null {
  const { room, status, participants, error, join, leave } = useRoom()
  const [credentials, setCredentials] = useState<SavedCredentials | null>(null)

  useEffect(() => {
    window.telao.loadCredentials().then(setCredentials)
  }, [])

  const handleJoin = async (submitted: SavedCredentials): Promise<void> => {
    if (await join(submitted.name, submitted.password)) {
      setCredentials(submitted)
      await window.telao.saveCredentials(submitted)
    }
  }

  if (status === 'connected' || status === 'reconnecting') {
    return (
      <RoomScreen
        room={room}
        participants={participants}
        isReconnecting={status === 'reconnecting'}
        onLeave={leave}
      />
    )
  }

  if (!credentials) return null

  return (
    <LoginScreen
      initial={credentials}
      isConnecting={status === 'connecting'}
      error={error}
      onSubmit={handleJoin}
    />
  )
}

export default App
