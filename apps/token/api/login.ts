import { isPasswordValid, jsonResponse, preflightResponse, readBody } from '../lib/http.js'

export function OPTIONS(): Response {
  return preflightResponse()
}

export async function POST(request: Request): Promise<Response> {
  const { GROUP_PASSWORD } = process.env
  if (!GROUP_PASSWORD) return jsonResponse({ error: 'server_misconfigured' }, 500)

  const body = await readBody(request)
  if (!body) return jsonResponse({ error: 'invalid_body' }, 400)
  if (!isPasswordValid(body.password, GROUP_PASSWORD)) {
    return jsonResponse({ error: 'invalid_password' }, 401)
  }

  return jsonResponse({ status: 'ok' }, 200)
}
