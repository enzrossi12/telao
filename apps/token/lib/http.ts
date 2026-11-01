import { createHash, timingSafeEqual } from 'node:crypto'

// The group password is what protects these endpoints, not the origin: the app calls them from
// file:// when packaged and from localhost in dev.
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
}

export function jsonResponse(body: Record<string, string>, status: number): Response {
  return Response.json(body, { status, headers: CORS_HEADERS })
}

export function preflightResponse(): Response {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}

export async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json()
    return typeof body === 'object' && body !== null ? (body as Record<string, unknown>) : null
  } catch {
    return null
  }
}

function sha256(value: string): Buffer {
  return createHash('sha256').update(value).digest()
}

// Hashing first gives timingSafeEqual two buffers of the same length for any input.
export function isPasswordValid(received: unknown, expected: string): boolean {
  return typeof received === 'string' && timingSafeEqual(sha256(received), sha256(expected))
}
