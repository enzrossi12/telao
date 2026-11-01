import { IpcMainInvokeEvent } from 'electron'
import { join } from 'path'
import { pathToFileURL } from 'url'

export function isAppUrl(url: string | undefined): boolean {
  if (!url) return false

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (devUrl) return new URL(url).origin === new URL(devUrl).origin

  return url === pathToFileURL(join(__dirname, '../renderer/index.html')).href
}

// Only the app's own page may call IPC handlers.
export function isAppFrame(event: IpcMainInvokeEvent): boolean {
  return isAppUrl(event.senderFrame?.url)
}
