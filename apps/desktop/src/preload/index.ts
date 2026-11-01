import { contextBridge } from 'electron'

// Only specific functions go here, never ipcRenderer itself (see skill electron-seguro).
contextBridge.exposeInMainWorld('telao', {
  electronVersion: process.versions.electron
})
