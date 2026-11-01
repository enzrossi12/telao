import { desktopCapturer, ipcMain, session } from 'electron'
import { IPC, ScreenSource } from '../../shared/ipc'
import { isAppFrame, isAppUrl } from './sender'

const SOURCE_ID_PATTERN = /^(window|screen):[\w:-]{1,64}$/

// Set by the app's own picker and consumed by the next getDisplayMedia call.
let selectedSourceId: string | null = null

async function listScreenSources(): Promise<ScreenSource[]> {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 320, height: 180 },
    fetchWindowIcons: true
  })
  return sources.map((source) => ({
    id: source.id,
    name: source.name,
    kind: source.id.startsWith('screen:') ? 'screen' : 'window',
    thumbnailDataUrl: source.thumbnail.toDataURL(),
    iconDataUrl: source.appIcon?.toDataURL() ?? null
  }))
}

async function findSource(id: string): Promise<Electron.DesktopCapturerSource | undefined> {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 0, height: 0 }
  })
  return sources.find((source) => source.id === id)
}

export function registerScreenIpc(): void {
  ipcMain.handle(IPC.LIST_SCREEN_SOURCES, (event) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    return listScreenSources()
  })

  ipcMain.handle(IPC.SELECT_SCREEN_SOURCE, (event, id: unknown) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    if (typeof id !== 'string' || !SOURCE_ID_PATTERN.test(id)) {
      throw new Error('Invalid source id')
    }
    selectedSourceId = id
  })

  // Nothing is captured without a choice made in the picker, and the choice works only once.
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    const sourceId = selectedSourceId
    selectedSourceId = null
    if (!sourceId || !isAppUrl(request.frame?.url)) {
      callback(null)
      return
    }

    try {
      const source = await findSource(sourceId)
      callback(source ? { video: source } : null)
    } catch {
      callback(null)
    }
  })
}
