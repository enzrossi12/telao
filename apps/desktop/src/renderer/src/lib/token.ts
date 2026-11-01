export type JoinError = 'wrong_password' | 'invalid_name' | 'offline' | 'server' | 'connection_lost'

export class TokenError extends Error {
  constructor(readonly reason: JoinError) {
    super(reason)
  }
}

export async function fetchToken(name: string, password: string): Promise<string> {
  let response: Response
  try {
    response = await fetch(import.meta.env.VITE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, password })
    })
  } catch {
    throw new TokenError(navigator.onLine ? 'server' : 'offline')
  }

  if (response.status === 401) throw new TokenError('wrong_password')
  if (response.status === 400) throw new TokenError('invalid_name')
  if (!response.ok) throw new TokenError('server')

  const { token } = (await response.json()) as { token: string }
  return token
}
