import { FormEvent, useEffect, useState } from 'react'
import { JOIN_ERROR_MESSAGES, JoinError } from '../lib/token'

interface LoginScreenProps {
  initialName: string
  initialPassword: string
  isBusy: boolean
  error: JoinError | null
  onSubmit: (name: string, password: string) => void
}

function LoginScreen({
  initialName,
  initialPassword,
  isBusy,
  error,
  onSubmit
}: LoginScreenProps): React.JSX.Element {
  const [name, setName] = useState(initialName)
  const [password, setPassword] = useState(initialPassword)
  const [nameTooShort, setNameTooShort] = useState(false)
  const [version, setVersion] = useState<string | null>(null)

  useEffect(() => {
    window.telao.getAppVersion().then(setVersion)
  }, [])

  const handleSubmit = (event: FormEvent): void => {
    event.preventDefault()
    const trimmedName = name.trim()
    setNameTooShort(trimmedName.length < 2)
    if (trimmedName.length >= 2) onSubmit(trimmedName, password)
  }

  const message = nameTooShort
    ? JOIN_ERROR_MESSAGES.invalid_name
    : error && JOIN_ERROR_MESSAGES[error]

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

        <button type="submit" disabled={isBusy}>
          {isBusy ? 'Verificando…' : 'Continuar'}
        </button>

        {version && <p className="login-version">Versão {version}</p>}
      </form>
    </main>
  )
}

export default LoginScreen
