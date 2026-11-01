import { useState } from 'react'
import { JOIN_ERROR_MESSAGES, JoinError } from '../lib/token'
import RoomForm, { RoomFormMode } from './RoomForm'

interface LobbyScreenProps {
  userName: string
  savedRoomName: string
  savedRoomPassword: string
  isConnecting: boolean
  error: JoinError | null
  onClearError: () => void
  onSubmit: (mode: RoomFormMode, roomName: string, roomPassword: string) => void
  onBack: () => void
}

function LobbyScreen({
  userName,
  savedRoomName,
  savedRoomPassword,
  isConnecting,
  error,
  onClearError,
  onSubmit,
  onBack
}: LobbyScreenProps): React.JSX.Element {
  const [mode, setMode] = useState<RoomFormMode | null>(null)

  const openMode = (next: RoomFormMode | null): void => {
    onClearError()
    setMode(next)
  }

  if (mode) {
    const isJoining = mode === 'join'
    return (
      <RoomForm
        mode={mode}
        initialName={isJoining ? savedRoomName : ''}
        initialPassword={isJoining ? savedRoomPassword : ''}
        isBusy={isConnecting}
        error={error}
        onSubmit={(roomName, roomPassword) => onSubmit(mode, roomName, roomPassword)}
        onBack={() => openMode(null)}
      />
    )
  }

  return (
    <main className="login">
      <section className="login-card">
        <h1>Telão</h1>
        <p className="login-subtitle">E aí, {userName}</p>

        {error && (
          <p className="login-error" role="alert">
            {JOIN_ERROR_MESSAGES[error]}
          </p>
        )}

        <button type="button" onClick={() => openMode('create')}>
          Criar sala
        </button>
        <button type="button" onClick={() => openMode('join')}>
          Entrar em uma sala
        </button>
        <button type="button" className="login-secondary" onClick={onBack}>
          Trocar nome ou senha do grupo
        </button>
      </section>
    </main>
  )
}

export default LobbyScreen
