import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { IPC, SavedCredentials, ScreenSource } from '../shared/ipc'

// Only specific functions go here, never ipcRenderer itself (see skill electron-seguro).
contextBridge.exposeInMainWorld('telao', {
  loadCredentials: (): Promise<SavedCredentials> => ipcRenderer.invoke(IPC.LOAD_CREDENTIALS),
  saveCredentials: (credentials: SavedCredentials): Promise<void> =>
    ipcRenderer.invoke(IPC.SAVE_CREDENTIALS, credentials),
  listScreenSources: (): Promise<ScreenSource[]> => ipcRenderer.invoke(IPC.LIST_SCREEN_SOURCES),
  selectScreenSource: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC.SELECT_SCREEN_SOURCE, id),
  isScreenAudioSupported: (): Promise<boolean> => ipcRenderer.invoke(IPC.IS_SCREEN_AUDIO_SUPPORTED),
  startScreenAudio: (): Promise<void> => ipcRenderer.invoke(IPC.START_SCREEN_AUDIO),
  stopScreenAudio: (): Promise<void> => ipcRenderer.invoke(IPC.STOP_SCREEN_AUDIO),
  onScreenAudioChunk: (listener: (chunk: Uint8Array) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, chunk: Uint8Array): void => listener(chunk)
    ipcRenderer.on(IPC.SCREEN_AUDIO_CHUNK, handler)
    return () => ipcRenderer.removeListener(IPC.SCREEN_AUDIO_CHUNK, handler)
  }
})
