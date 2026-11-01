import { app, globalShortcut, Menu, nativeImage, Tray } from 'electron'
import icon from '../../resources/icon.png?asset'
import { loadSettings, saveSettings } from './settings'

const SHARE_SHORTCUT = 'Control+Alt+S'
const SHARE_SHORTCUT_LABEL = 'Ctrl+Alt+S'

interface TrayActions {
  onOpen: () => void
  onToggleShare: () => void
}

let tray: Tray | null = null

function setShareShortcut(enabled: boolean, onToggleShare: () => void): boolean {
  if (!enabled) {
    globalShortcut.unregister(SHARE_SHORTCUT)
    return false
  }
  // Fails when another program already owns the combination.
  return globalShortcut.register(SHARE_SHORTCUT, onToggleShare)
}

function buildMenu(actions: TrayActions): Menu {
  return Menu.buildFromTemplate([
    { label: 'Abrir', click: actions.onOpen },
    { type: 'separator' },
    {
      label: 'Iniciar com o Windows',
      type: 'checkbox',
      // In dev this would register electron.exe itself to run at login.
      enabled: app.isPackaged,
      checked: app.getLoginItemSettings().openAtLogin,
      click: ({ checked }) => app.setLoginItemSettings({ openAtLogin: checked })
    },
    {
      label: `Atalho global (${SHARE_SHORTCUT_LABEL}) para compartilhar`,
      type: 'checkbox',
      checked: globalShortcut.isRegistered(SHARE_SHORTCUT),
      click: ({ checked }) => {
        const enabled = setShareShortcut(checked, actions.onToggleShare)
        saveSettings({ shareShortcutEnabled: enabled })
        tray?.setContextMenu(buildMenu(actions))
      }
    },
    { type: 'separator' },
    { label: 'Sair', click: () => app.quit() }
  ])
}

export function createTray(actions: TrayActions): void {
  setShareShortcut(loadSettings().shareShortcutEnabled, actions.onToggleShare)

  tray = new Tray(nativeImage.createFromPath(icon).resize({ width: 16, height: 16 }))
  tray.setToolTip('Telão')
  tray.setContextMenu(buildMenu(actions))
  tray.on('click', actions.onOpen)
}
