import { app, Menu, nativeImage, Tray } from 'electron'
import icon from '../../resources/icon.png?asset'

let tray: Tray | null = null

export function createTray(onOpen: () => void): void {
  tray = new Tray(nativeImage.createFromPath(icon).resize({ width: 16, height: 16 }))
  tray.setToolTip('Telão')
  tray.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Abrir', click: onOpen },
      { type: 'separator' },
      {
        label: 'Iniciar com o Windows',
        type: 'checkbox',
        // In dev this would register electron.exe itself to run at login.
        enabled: app.isPackaged,
        checked: app.getLoginItemSettings().openAtLogin,
        click: ({ checked }) => app.setLoginItemSettings({ openAtLogin: checked })
      },
      { type: 'separator' },
      { label: 'Sair', click: () => app.quit() }
    ])
  )
  tray.on('click', onOpen)
}
