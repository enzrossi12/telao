import { useEffect, useState } from 'react'
import { SavedCredentials } from '../../shared/ipc'
import LobbyScreen from './components/LobbyScreen'
import LoginScreen from './components/LoginScreen'
import { RoomFormMode } from './components/RoomForm'
import RoomScreen from './components/RoomScreen'
import ThemeToggle from './components/ThemeToggle'
import { useRoom } from './hooks/useRoom'
import { JoinError, TokenError, verifyGroupKey } from './lib/token'

function App(): React.JSX.Element | null {
  const { room, roomName, status, participants, error, clearError, join, leave } = useRoom()
  const [credentials, setCredentials] = useState<SavedCredentials | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [loginError, setLoginError] = useState<JoinError | null>(null)

  useEffect(() => {
    window.telao.loadCredentials().then(setCredentials)
  }, [])

  const remember = async (next: SavedCredentials): Promise<void> => {
    setCredentials(next)
    await window.telao.saveCredentials(next)
  }

  const handleLogin = async (name: string, password: string): Promise<void> => {
    if (!credentials) return
    setIsVerifying(true)
    setLoginError(null)
    try {
      await verifyGroupKey(password)
      await remember({ ...credentials, name, password })
      setIsLoggedIn(true)
    } catch (err) {
      setLoginError(err instanceof TokenError ? err.reason : 'server')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleRoom = async (
    mode: RoomFormMode,
    requestedName: string,
    roomPassword: string
  ): Promise<void> => {
    if (!credentials) return
    const joinedName = await join(
      { ...credentials, roomName: requestedName, roomPassword },
      mode === 'create'
    )
    if (joinedName) await remember({ ...credentials, roomName: joinedName, roomPassword })
  }

  if (status === 'connected' || status === 'reconnecting') {
    return (
      <RoomScreen
        room={room}
        roomName={roomName ?? ''}
        participants={participants}
        isReconnecting={status === 'reconnecting'}
        onLeave={leave}
      />
    )
  }

  if (!credentials) return null

  const screen = isLoggedIn ? (
    <LobbyScreen
      userName={credentials.name}
      savedRoomName={credentials.roomName}
      savedRoomPassword={credentials.roomPassword}
      isConnecting={status === 'connecting'}
      error={error}
      onClearError={clearError}
      onSubmit={handleRoom}
      onBack={() => {
        clearError()
        setIsLoggedIn(false)
      }}
    />
  ) : (
    <LoginScreen
      initialName={credentials.name}
      initialPassword={credentials.password}
      isBusy={isVerifying}
      error={loginError}
      onSubmit={handleLogin}
    />
  )

  return (
    <>
      <div className="theme-corner">
        <ThemeToggle />
      </div>
      {screen}
    </>
  )
}

export default App
