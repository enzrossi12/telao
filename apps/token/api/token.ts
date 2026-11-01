import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { AccessToken, TrackSource } from 'livekit-server-sdk'

// The group password is what protects this endpoint, not the origin: the app calls it from
// file:// when packaged and from localhost in dev.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

function jsonResponse(body: Record<string, string>, status: number): Response {
  return Response.json(body, { status, headers: CORS_HEADERS })
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

// Hashing first gives timingSafeEqual two buffers of the same length for any input.
function isPasswordValid(received: unknown, expected: string): boolean {
  return typeof received === 'string' && timingSafeEqual(sha256(received), sha256(expected))
}

function isNameValid(name: unknown): name is string {
  return typeof name === 'string' && name === name.trim() && name.length >= 2 && name.length <= 24
}

export function OPTIONS(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function POST(request: Request): Promise<Response> {
  const { LIVEKIT_API_KEY, LIVEKIT_API_SECRET, GROUP_PASSWORD } = process.env
  if (!LIVEKIT_API_KEY || !LIVEKIT_API_SECRET || !GROUP_PASSWORD) {
    return jsonResponse({ error: 'server_misconfigured' }, 500)
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return jsonResponse({ error: 'invalid_body' }, 400)
  }
  if (typeof body !== 'object' || body === null) {
    return jsonResponse({ error: 'invalid_body' }, 400)
  }

  const { name, password } = body as Record<string, unknown>
  if (!isPasswordValid(password, GROUP_PASSWORD)) {
    return jsonResponse({ error: 'invalid_password' }, 401)
  }
  if (!isNameValid(name)) {
    return jsonResponse({ error: 'invalid_name' }, 400)
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
    room: process.env.ROOM_NAME || 'telao',
    canSubscribe: true,
    canPublish: true,
    canPublishData: false,
    canPublishSources: [
      TrackSource.CAMERA,
      TrackSource.SCREEN_SHARE,
      TrackSource.SCREEN_SHARE_AUDIO
    ]
  })

  return jsonResponse({ token: await accessToken.toJwt() }, 200)
}
