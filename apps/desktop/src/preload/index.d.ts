import { SavedCredentials, ScreenAudioSupport, ScreenSource, ThemePreference } from '../shared/ipc'

declare global {
  interface Window {
    telao: {
      getAppVersion: () => Promise<string>
      getDownloadedUpdate: () => Promise<string | null>
      restartToUpdate: () => Promise<void>
      onUpdateDownloaded: (listener: (version: string) => void) => () => void
      loadCredentials: () => Promise<SavedCredentials>
      saveCredentials: (credentials: SavedCredentials) => Promise<void>
      listScreenSources: () => Promise<ScreenSource[]>
      selectScreenSource: (id: string) => Promise<void>
      getScreenAudioSupport: () => Promise<ScreenAudioSupport>
      startScreenAudio: () => Promise<void>
      stopScreenAudio: () => Promise<void>
      onScreenAudioChunk: (listener: (chunk: Uint8Array<ArrayBuffer>) => void) => () => void
      getTheme: () => Promise<ThemePreference>
      setTheme: (theme: ThemePreference) => Promise<void>
    }
  }
}

export {}
