export type JoinError =
  | 'wrong_password'
  | 'invalid_name'
  | 'invalid_room'
  | 'room_exists'
  | 'room_not_found'
  | 'wrong_room_password'
  | 'offline'
  | 'server'
  | 'connection_lost'

export const JOIN_ERROR_MESSAGES: Record<JoinError, string> = {
  wrong_password: 'Senha do grupo incorreta.',
  invalid_name: 'O nome precisa ter de 2 a 24 caracteres.',
  invalid_room: 'A sala precisa de um nome de 2 a 32 caracteres e senha de 4 a 64.',
  room_exists: 'Já existe uma sala com esse nome.',
  room_not_found: 'Sala não encontrada. Ela some depois de 7 dias sem uso.',
  wrong_room_password: 'Senha da sala incorreta.',
  offline: 'Sem conexão com a internet.',
  server: 'Servidor fora do ar. Tente de novo em instantes.',
  connection_lost: 'A conexão com a sala foi perdida.'
}

const ERROR_BY_SERVER_CODE: Record<string, JoinError> = {
  invalid_password: 'wrong_password',
  invalid_name: 'invalid_name',
  invalid_room: 'invalid_room',
  room_exists: 'room_exists',
  room_not_found: 'room_not_found',
  invalid_room_password: 'wrong_room_password'
}

export class TokenError extends Error {
  constructor(readonly reason: JoinError) {
    super(reason)
  }
}

export interface JoinRequest {
  name: string
  password: string
  roomName: string
  roomPassword: string
}

async function post<T>(path: string, body: Record<string, string>): Promise<T> {
  let response: Response
  try {
    response = await fetch(new URL(path, import.meta.env.VITE_TOKEN_URL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
  } catch {
    throw new TokenError(navigator.onLine ? 'server' : 'offline')
  }

  const payload = (await response.json().catch(() => ({}))) as T & { error?: string }
  if (!response.ok) throw new TokenError(ERROR_BY_SERVER_CODE[payload.error ?? ''] ?? 'server')
  return payload
}

export async function verifyGroupKey(password: string): Promise<void> {
  await post('/api/login', { password })
}

export async function createRoom(
  password: string,
  roomName: string,
  roomPassword: string
): Promise<void> {
  await post('/api/rooms', { password, roomName, roomPassword })
}

export function fetchToken(request: JoinRequest): Promise<{ token: string; roomName: string }> {
  return post('/api/token', { ...request })
}
