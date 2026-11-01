import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'
import { IPC, SavedCredentials, ScreenAudioSupport, ScreenSource } from '../shared/ipc'

// Only specific functions go here, never ipcRenderer itself (see skill electron-seguro).
contextBridge.exposeInMainWorld('telao', {
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(IPC.GET_APP_VERSION),
  getDownloadedUpdate: (): Promise<string | null> => ipcRenderer.invoke(IPC.GET_DOWNLOADED_UPDATE),
  restartToUpdate: (): Promise<void> => ipcRenderer.invoke(IPC.RESTART_TO_UPDATE),
  onUpdateDownloaded: (listener: (version: string) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, version: string): void => listener(version)
    ipcRenderer.on(IPC.UPDATE_DOWNLOADED, handler)
    return () => ipcRenderer.removeListener(IPC.UPDATE_DOWNLOADED, handler)
  },
  loadCredentials: (): Promise<SavedCredentials> => ipcRenderer.invoke(IPC.LOAD_CREDENTIALS),
  saveCredentials: (credentials: SavedCredentials): Promise<void> =>
    ipcRenderer.invoke(IPC.SAVE_CREDENTIALS, credentials),
  listScreenSources: (): Promise<ScreenSource[]> => ipcRenderer.invoke(IPC.LIST_SCREEN_SOURCES),
  selectScreenSource: (id: string): Promise<void> =>
    ipcRenderer.invoke(IPC.SELECT_SCREEN_SOURCE, id),
  getScreenAudioSupport: (): Promise<ScreenAudioSupport> =>
    ipcRenderer.invoke(IPC.GET_SCREEN_AUDIO_SUPPORT),
  startScreenAudio: (): Promise<void> => ipcRenderer.invoke(IPC.START_SCREEN_AUDIO),
  stopScreenAudio: (): Promise<void> => ipcRenderer.invoke(IPC.STOP_SCREEN_AUDIO),
  onScreenAudioChunk: (listener: (chunk: Uint8Array) => void): (() => void) => {
    const handler = (_event: IpcRendererEvent, chunk: Uint8Array): void => listener(chunk)
    ipcRenderer.on(IPC.SCREEN_AUDIO_CHUNK, handler)
    return () => ipcRenderer.removeListener(IPC.SCREEN_AUDIO_CHUNK, handler)
  }
})
