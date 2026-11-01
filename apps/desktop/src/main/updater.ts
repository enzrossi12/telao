import { app, BrowserWindow, ipcMain } from 'electron'
import { autoUpdater } from 'electron-updater'
import { IPC } from '../shared/ipc'
import { isAppFrame } from './ipc/sender'

const CHECK_INTERVAL_MS = 6 * 60 * 60 * 1000

// Kept here because the download can finish before the renderer is listening.
let downloadedVersion: string | null = null

function checkForUpdates(): void {
  autoUpdater.checkForUpdates().catch((err) => console.error('Update check failed', err))
}

function startUpdateChecks(): void {
  autoUpdater.on('error', (err) => console.error('Update failed', err))
  autoUpdater.on('update-downloaded', ({ version }) => {
    downloadedVersion = version
    BrowserWindow.getAllWindows().forEach((window) =>
      window.webContents.send(IPC.UPDATE_DOWNLOADED, version)
    )
  })

  checkForUpdates()
  setInterval(checkForUpdates, CHECK_INTERVAL_MS)
}

export function registerUpdater(): void {
  ipcMain.handle(IPC.GET_DOWNLOADED_UPDATE, (event) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    return downloadedVersion
  })

  ipcMain.handle(IPC.RESTART_TO_UPDATE, (event) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    if (downloadedVersion) autoUpdater.quitAndInstall(true, true)
  })

  // A dev run has no release to compare against.
  if (app.isPackaged) startUpdateChecks()
}
