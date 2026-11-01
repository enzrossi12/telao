import { SavedCredentials, ScreenSource } from '../shared/ipc'

declare global {
  interface Window {
    telao: {
      loadCredentials: () => Promise<SavedCredentials>
      saveCredentials: (credentials: SavedCredentials) => Promise<void>
      listScreenSources: () => Promise<ScreenSource[]>
      selectScreenSource: (id: string) => Promise<void>
      onToggleScreenShare: (listener: () => void) => () => void
    }
  }
}

export {}
