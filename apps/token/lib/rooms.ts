import { randomBytes, randomUUID, scrypt, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'

// A room disappears after this long without anyone joining it.
const ROOM_TTL_SECONDS = 7 * 24 * 60 * 60

const HASH_LENGTH = 32
const NAME_LENGTH = { min: 2, max: 32 }
const PASSWORD_LENGTH = { min: 4, max: 64 }

const scryptAsync = promisify<string, Buffer, number, Buffer>(scrypt)

interface StoredRoom {
  name: string
  roomId: string
  salt: string
  hash: string
}

export type RoomLookup = { name: string; roomId: string } | 'not_found' | 'wrong_password'

export function isRoomNameValid(name: unknown): name is string {
  return (
    typeof name === 'string' &&
    name === name.trim() &&
    name.length >= NAME_LENGTH.min &&
    name.length <= NAME_LENGTH.max
  )
}

export function isRoomPasswordValid(password: unknown): password is string {
  return (
    typeof password === 'string' &&
    password.length >= PASSWORD_LENGTH.min &&
    password.length <= PASSWORD_LENGTH.max
  )
}

function roomKey(name: string): string {
  return `room:${name.normalize('NFKC').toLowerCase()}`
}

async function redis(command: (string | number)[]): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN
  if (!url || !token) throw new Error('Redis is not configured')

  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(command)
  })
  if (!response.ok) throw new Error(`Redis responded ${response.status}`)

  const { result } = (await response.json()) as { result: unknown }
  return result
}

async function hashPassword(password: string, salt: Buffer): Promise<Buffer> {
  return scryptAsync(password, salt, HASH_LENGTH)
}

// Returns false when the name is taken. NX makes that check atomic.
export async function createRoom(name: string, password: string): Promise<boolean> {
  const salt = randomBytes(16)
  const hash = await hashPassword(password, salt)
  const room: StoredRoom = {
    name,
    roomId: `sala-${randomUUID()}`,
    salt: salt.toString('base64'),
    hash: hash.toString('base64')
  }

  const result = await redis([
    'SET',
    roomKey(name),
    JSON.stringify(room),
    'NX',
    'EX',
    ROOM_TTL_SECONDS
  ])
  return result === 'OK'
}

export async function findRoom(name: string, password: string): Promise<RoomLookup> {
  const key = roomKey(name)
  const stored = await redis(['GET', key])
  if (typeof stored !== 'string') return 'not_found'

  const room = JSON.parse(stored) as StoredRoom
  const hash = await hashPassword(password, Buffer.from(room.salt, 'base64'))
  if (!timingSafeEqual(hash, Buffer.from(room.hash, 'base64'))) return 'wrong_password'

  await redis(['EXPIRE', key, ROOM_TTL_SECONDS])
  return { name: room.name, roomId: room.roomId }
}
