import { randomBytes } from 'node:crypto'
import { AccessToken, TrackSource } from 'livekit-server-sdk'
import { isPasswordValid, jsonResponse, preflightResponse, readBody } from '../lib/http.js'
import { findRoom, isRoomNameValid, isRoomPasswordValid } from '../lib/rooms.js'

function isNameValid(name: unknown): name is string {
  return typeof name === 'string' && name === name.trim() && name.length >= 2 && name.length <= 24
}

export function OPTIONS(): Response {
  return preflightResponse()
}

export async function POST(request: Request): Promise<Response> {
  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, GROUP_PASSWORD } = process.env
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !GROUP_PASSWORD) {
    return jsonResponse({ error: 'server_misconfigured' }, 500)
  }

  const body = await readBody(request)
  if (!body) return jsonResponse({ error: 'invalid_body' }, 400)

  const { name, password, roomName, roomPassword } = body
  if (!isPasswordValid(password, GROUP_PASSWORD)) {
    return jsonResponse({ error: 'invalid_password' }, 401)
  }
  if (!isNameValid(name)) {
    return jsonResponse({ error: 'invalid_name' }, 400)
  }

  // Versions up to 0.1.5 send no room and always join the fixed one.
  let room = { name: 'Telão', roomId: process.env.ROOM_NAME || 'telao' }
  if (roomName !== undefined) {
    if (!isRoomNameValid(roomName) || !isRoomPasswordValid(roomPassword)) {
      return jsonResponse({ error: 'invalid_room' }, 400)
    }

    try {
      const found = await findRoom(roomName, roomPassword)
      if (found === 'not_found') return jsonResponse({ error: 'room_not_found' }, 404)
      if (found === 'wrong_password') return jsonResponse({ error: 'invalid_room_password' }, 403)
      room = found
    } catch (err) {
      console.error('Room lookup failed', err)
      return jsonResponse({ error: 'storage_unavailable' }, 500)
    }
  }

  // The suffix keeps two friends with the same display name from sharing an identity.
  const identity = `${name}-${randomBytes(3).toString('hex')}`
  const accessToken = new AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET, {
    identity,
    name,
    ttl: '6h'
  })
  accessToken.addGrant({
    roomJoin: true,
    room: room.roomId,
    canSubscribe: true,
    canPublish: true,
    canPublishData: false,
    canPublishSources: [
      TrackSource.CAMERA,
      TrackSource.SCREEN_SHARE,
      TrackSource.SCREEN_SHARE_AUDIO
    ]
  })

  return jsonResponse({ token: await accessToken.toJwt(), roomName: room.name }, 200)
}
