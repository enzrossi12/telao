import { SavedCredentials, ScreenSource } from '../shared/ipc'

declare global {
  interface Window {
    telao: {
      getAppVersion: () => Promise<string>
      loadCredentials: () => Promise<SavedCredentials>
      saveCredentials: (credentials: SavedCredentials) => Promise<void>
      listScreenSources: () => Promise<ScreenSource[]>
      selectScreenSource: (id: string) => Promise<void>
      isScreenAudioSupported: () => Promise<boolean>
      startScreenAudio: () => Promise<void>
      stopScreenAudio: () => Promise<void>
      onScreenAudioChunk: (listener: (chunk: Uint8Array<ArrayBuffer>) => void) => () => void
    }
  }
}

export {}
