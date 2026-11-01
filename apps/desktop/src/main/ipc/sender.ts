import { IpcMainInvokeEvent } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'

// Only the app's own page may call IPC handlers.
export function isAppFrame(event: IpcMainInvokeEvent): boolean {
  const url = event.senderFrame?.url
  if (!url) return false

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) return new URL(url).origin === new URL(devUrl).origin

  return url === pathToFileURL(join(__dirname, '../renderer/index.html')).href
}
