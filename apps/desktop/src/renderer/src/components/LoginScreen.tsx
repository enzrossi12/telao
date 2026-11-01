import { FormEvent, useEffect, useState } from 'react'
import { SavedCredentials } from '../../../shared/ipc'
import { JoinError } from '../lib/token'

const ERROR_MESSAGES: Record<JoinError, string> = {
  wrong_password: 'Senha do grupo incorreta.',
  invalid_name: 'O nome precisa ter de 2 a 24 caracteres.',
  offline: 'Sem conexão com a internet.',
  server: 'Servidor fora do ar. Tente de novo em instantes.',
  connection_lost: 'A conexão com a sala foi perdida.'
}

interface LoginScreenProps {
  initial: SavedCredentials
  isConnecting: boolean
  error: JoinError | null
  onSubmit: (credentials: SavedCredentials) => void
}

function LoginScreen({
  initial,
  isConnecting,
  error,
  onSubmit
}: LoginScreenProps): React.JSX.Element {
  const [name, setName] = useState(initial.name)
  const [password, setPassword] = useState(initial.password)
  const [nameTooShort, setNameTooShort] = useState(false)
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    window.telao.getAppVersion().then(setVersion)
  }, [])

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault()
    const trimmedName = name.trim()
    setNameTooShort(trimmedName.length < 2)
    if (trimmedName.length >= 2) onSubmit({ name: trimmedName, password })
  }

  const message = nameTooShort ? ERROR_MESSAGES.invalid_name : error && ERROR_MESSAGES[error]

  return (
    <main className="login">
      <form className="login-card" onSubmit={handleSubmit}>
        <h1>Telão</h1>
        <p className="login-subtitle">Compartilha a bosta dessa tela</p>

        <label>
          Nome
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            maxLength={24}
            autoFocus
            required
          />
        </label>

        <label>
          Senha do grupo
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {message && (
          <p className="login-error" role="alert">
            {message}
          </p>
        )}

        <button type="submit" disabled={isConnecting}>
          {isConnecting ? 'Entrando…' : 'Entrar'}
        </button>

        {version && <p className="login-version">Versão {version}</p>}
      </form>
    </main>
  )
}

export default LoginScreen
