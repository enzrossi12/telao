import { app, BrowserWindow } from 'electron'
import { join } from 'path'
import icon from '../../resources/icon.png?asset'
import { registerAppInfoIpc } from './ipc/appInfo'
import { registerCredentialsIpc } from './ipc/credentials'
import { registerScreenIpc } from './ipc/screen'
import { registerScreenAudioIpc } from './ipc/screenAudio'
import { createTray } from './tray'
import { loadWindowState, MIN_SIZE, saveWindowState } from './windowState'

let mainWindow: BrowserWindow | null = null
let isQuitting = false

function createWindow(): void {
  const { bounds, isMaximized } = loadWindowState()

  mainWindow = new BrowserWindow({
    ...bounds,
    ...MIN_SIZE,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#1e1f24',
    title: 'Telão',
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      // Sharing keeps running while the window sits in the tray.
      backgroundThrottling: false
    }
  })

  if (isMaximized) mainWindow.maximize()

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Closing only hides the window: the app leaves through the tray menu.
  mainWindow.on('close', (event) => {
    if (mainWindow) saveWindowState(mainWindow)
    if (isQuitting) return
    event.preventDefault()
    mainWindow?.hide()
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

function showWindow(): void {
  if (mainWindow?.isMinimized()) mainWindow.restore()
  mainWindow?.show()
  mainWindow?.focus()
}

// Dev-only switches for running several instances side by side (see skill testar-sala).
if (!app.isPackaged && process.env['TELAO_USER_DATA']) {
  app.setPath('userData', process.env['TELAO_USER_DATA'])
}
const allowMultipleInstances = !app.isPackaged && process.env['TELAO_MULTI_INSTANCE'] === '1'

if (!allowMultipleInstances && !app.requestSingleInstanceLock()) {
  app.quit()
} else {
  app.on('second-instance', showWindow)

  app.on('before-quit', () => {
    isQuitting = true
  })

  app.whenReady().then(() => {
    app.setAppUserModelId('com.telao.app')
    registerAppInfoIpc()
    registerCredentialsIpc()
    registerScreenIpc()
    registerScreenAudioIpc()
    createWindow()
    createTray(showWindow)
  })

  app.on('window-all-closed', () => {
    app.quit()
  })
}
