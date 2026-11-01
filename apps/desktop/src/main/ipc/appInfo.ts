import { app, ipcMain } from 'electron'
import { IPC } from '../../shared/ipc'
import { isAppFrame } from './sender'

export function registerAppInfoIpc(): void {
  ipcMain.handle(IPC.GET_APP_VERSION, (event) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    return app.getVersion()
  })
}
