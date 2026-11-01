import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import { registerCredentialsIpc } from './ipc/credentials'
import { registerScreenIpc } from './ipc/screen'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 700,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1e1f24',
    title: 'Telão',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))

  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (url !== mainWindow?.webContents.getURL()) event.preventDefault()
  })

  // ELECTRON_RENDERER_URL points to the Vite dev server and is only set by electron-vite dev.
  if (!app.isPackaged && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// Dev-only switches for running several instances side by side (see skill testar-sala).
if (!app.isPackaged && process.env['TELAO_USER_DATA']) {
  app.setPath('userData', process.env['TELAO_USER_DATA'])
}
const allowMultipleInstances = !app.isPackaged && process.env['TELAO_MULTI_INSTANCE'] === '1'

if (!allowMultipleInstances && !app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow?.isMinimized()) mainWindow.restore()
    mainWindow?.focus()
  })

  app.whenReady().then(() => {
    app.setAppUserModelId('com.telao.app')
    registerCredentialsIpc()
    registerScreenIpc()
    createWindow()
  })

  app.on('window-all-closed', () => {
    app.quit()
  })
}
