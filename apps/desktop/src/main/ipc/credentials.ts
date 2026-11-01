import { app, ipcMain, safeStorage } from 'electron'
import { readFile, writeFile } from 'fs/promises'
import { join } from 'path'
import { IPC, SavedCredentials } from '../../shared/ipc'
import { isAppFrame } from './sender'

const MAX_NAME_LENGTH = 24
const MAX_PASSWORD_LENGTH = 256

function credentialsPath(): string {
  return join(app.getPath('userData'), 'credentials.json')
}

async function loadCredentials(): Promise<SavedCredentials> {
  try {
    const stored = JSON.parse(await readFile(credentialsPath(), 'utf8'))
    const name = typeof stored.name === 'string' ? stored.name : ''
    const password =
      typeof stored.password === 'string' && stored.password && safeStorage.isEncryptionAvailable()
        ? safeStorage.decryptString(Buffer.from(stored.password, 'base64'))
        : ''
    return { name, password }
  } catch {
    return { name: '', password: '' }
  }
}

// Without OS encryption only the name is kept: the password never goes to disk in plain text.
async function saveCredentials({ name, password }: SavedCredentials): Promise<void> {
  const encrypted = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(password).toString('base64')
    : ''
  await writeFile(credentialsPath(), JSON.stringify({ name, password: encrypted }))
}

function isSavedCredentials(value: unknown): value is SavedCredentials {
  if (typeof value !== 'object' || value === null) return false
  const { name, password } = value as Record<string, unknown>
  return (
    typeof name === 'string' &&
    name.length <= MAX_NAME_LENGTH &&
    typeof password === 'string' &&
    password.length <= MAX_PASSWORD_LENGTH
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
