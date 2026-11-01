import { SavedCredentials } from '../shared/ipc'

declare global {
  interface Window {
    telao: {
      loadCredentials: () => Promise<SavedCredentials>
      saveCredentials: (credentials: SavedCredentials) => Promise<void>
    }
  }
}

export {}
