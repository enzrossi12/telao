import { contextBridge, ipcRenderer } from 'electron'
import { IPC, SavedCredentials } from '../shared/ipc'

// Only specific functions go here, never ipcRenderer itself (see skill electron-seguro).
contextBridge.exposeInMainWorld('telao', {
  loadCredentials: (): Promise<SavedCredentials> => ipcRenderer.invoke(IPC.LOAD_CREDENTIALS),
  saveCredentials: (credentials: SavedCredentials): Promise<void> =>
    ipcRenderer.invoke(IPC.SAVE_CREDENTIALS, credentials)
})
