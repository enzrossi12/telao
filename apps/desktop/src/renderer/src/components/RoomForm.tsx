import { FormEvent, useState } from 'react'
import { JOIN_ERROR_MESSAGES, JoinError } from '../lib/token'
import Spinner from './Spinner'

export type RoomFormMode = 'create' | 'join'

const NAME_LENGTH = { min: 2, max: 32 }
const PASSWORD_LENGTH = { min: 4, max: 64 }

const TEXTS: Record<RoomFormMode, { title: string; action: string; busy: string }> = {
  create: { title: 'Criar sala', action: 'Criar sala', busy: 'Criando…' },
  join: { title: 'Entrar em uma sala', action: 'Entrar', busy: 'Entrando…' }
}

interface RoomFormProps {
  mode: RoomFormMode
  initialName: string
  initialPassword: string
  isBusy: boolean
  error: JoinError | null
  onSubmit: (roomName: string, roomPassword: string) => void
  onBack: () => void
}

function RoomForm({
  mode,
  initialName,
  initialPassword,
  isBusy,
  error,
  onSubmit,
  onBack
}: RoomFormProps): React.JSX.Element {
  const [roomName, setRoomName] = useState(initialName)
  const [roomPassword, setRoomPassword] = useState(initialPassword)
  const [isInvalid, setIsInvalid] = useState(false)
  const { title, action, busy } = TEXTS[mode]

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault()
    const trimmedName = roomName.trim()
    const isValid =
      trimmedName.length >= NAME_LENGTH.min &&
      trimmedName.length <= NAME_LENGTH.max &&
      roomPassword.length >= PASSWORD_LENGTH.min &&
      roomPassword.length <= PASSWORD_LENGTH.max
    setIsInvalid(!isValid)
    if (isValid) onSubmit(trimmedName, roomPassword)
  }

  const message = isInvalid ? JOIN_ERROR_MESSAGES.invalid_room : error && JOIN_ERROR_MESSAGES[error]

  return (
    <main className="login">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>{title}</h1>

        <label>
          Nome da sala
          <input
            value={roomName}
            onChange={(event) => setRoomName(event.target.value)}
            maxLength={NAME_LENGTH.max}
            autoFocus
            required
          />
        </label>

        <label>
          Senha da sala
          <input
            type="password"
            value={roomPassword}
            onChange={(event) => setRoomPassword(event.target.value)}
            maxLength={PASSWORD_LENGTH.max}
            required
          />
        </label>

        {message && (
          <p className="login-error" role="alert">
            {message}
          </p>
        )}

        <button type="submit" disabled={isBusy}>
          {isBusy && <Spinner />}
          {isBusy ? busy : action}
        </button>
        <button type="button" className="login-secondary" disabled={isBusy} onClick={onBack}>
          Voltar
        </button>
      </form>
    </main>
  )
}

export default RoomForm
