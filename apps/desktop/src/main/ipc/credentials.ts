import { app, ipcMain, safeStorage } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { IPC, SavedCredentials } from '../../shared/ipc'
import { isAppFrame } from './sender'

const MAX_NAME_LENGTH = 24
const MAX_ROOM_NAME_LENGTH = 32
const MAX_PASSWORD_LENGTH = 256

function credentialsPath(): string {
  return join(app.getPath('userData'), 'credentials.json')
}

function decrypt(value: unknown): string {
  return typeof value === 'string' && value && safeStorage.isEncryptionAvailable()
    ? safeStorage.decryptString(Buffer.from(value, 'base64'))
    : ''
}

// Without OS encryption only the names are kept: passwords never go to disk in plain text.
function encrypt(value: string): string {
  return safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(value).toString('base64')
    : ''
}

// Files saved by older versions have no room fields, which come back empty.
async function loadCredentials(): Promise<SavedCredentials> {
  try {
    const stored = JSON.parse(await readFile(credentialsPath(), 'utf8'))
    return {
      name: typeof stored.name === 'string' ? stored.name : '',
      password: decrypt(stored.password),
      roomName: typeof stored.roomName === 'string' ? stored.roomName : '',
      roomPassword: decrypt(stored.roomPassword)
    }
  } catch {
    return { name: '', password: '', roomName: '', roomPassword: '' }
  }
}

async function saveCredentials(credentials: SavedCredentials): Promise<void> {
  const { name, password, roomName, roomPassword } = credentials
  await writeFile(
    credentialsPath(),
    JSON.stringify({
      name,
      password: encrypt(password),
      roomName,
      roomPassword: encrypt(roomPassword)
    })
  )
}

function isShortString(value: unknown, maxLength: number): boolean {
  return typeof value === 'string' && value.length <= maxLength
}

function isSavedCredentials(value: unknown): value is SavedCredentials {
  if (typeof value !== 'object' || value === null) return false
  const { name, password, roomName, roomPassword } = value as Record<string, unknown>
  return (
    isShortString(name, MAX_NAME_LENGTH) &&
    isShortString(password, MAX_PASSWORD_LENGTH) &&
    isShortString(roomName, MAX_ROOM_NAME_LENGTH) &&
    isShortString(roomPassword, MAX_PASSWORD_LENGTH)
  )
}

export function registerCredentialsIpc(): void {
  ipcMain.handle(IPC.LOAD_CREDENTIALS, (event) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    return loadCredentials()
  })

  ipcMain.handle(IPC.SAVE_CREDENTIALS, (event, credentials: unknown) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    if (!isSavedCredentials(credentials)) throw new Error('Invalid credentials')
    return saveCredentials(credentials)
  })
}
