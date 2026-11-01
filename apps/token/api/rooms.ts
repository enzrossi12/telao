import { isPasswordValid, jsonResponse, preflightResponse, readBody } from '../lib/http.js'
import { createRoom, isRoomNameValid, isRoomPasswordValid } from '../lib/rooms.js'

export function OPTIONS(): Response {
  return preflightResponse()
}

export async function POST(request: Request): Promise<Response> {
  const { GROUP_PASSWORD } = process.env
  if (!GROUP_PASSWORD) return jsonResponse({ error: 'server_misconfigured' }, 500)

  const body = await readBody(request)
  if (!body) return jsonResponse({ error: 'invalid_body' }, 400)

  const { password, roomName, roomPassword } = body
  if (!isPasswordValid(password, GROUP_PASSWORD)) {
    return jsonResponse({ error: 'invalid_password' }, 401)
  }
  if (!isRoomNameValid(roomName) || !isRoomPasswordValid(roomPassword)) {
    return jsonResponse({ error: 'invalid_room' }, 400)
  }

  try {
    if (!(await createRoom(roomName, roomPassword))) {
      return jsonResponse({ error: 'room_exists' }, 409)
    }
  } catch (err) {
    console.error('Room creation failed', err)
    return jsonResponse({ error: 'storage_unavailable' }, 500)
  }

  return jsonResponse({ roomName }, 201)
}
