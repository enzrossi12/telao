import { ipcMain, nativeTheme } from 'electron'
import { IPC, THEME_PREFERENCES, ThemePreference } from '../../shared/ipc'
import { readJsonFile, writeJsonFile } from '../jsonFile'
import { isAppFrame } from './sender'

const THEME_FILE = 'theme.json'

// Same as --bg in the renderer's main.css.
const BACKGROUNDS = { dark: '#111113', light: '#f7f7f8' }

function isThemePreference(value: unknown): value is ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference)
}

function loadTheme(): ThemePreference {
  const stored = readJsonFile(THEME_FILE) as { theme?: unknown } | null
  return isThemePreference(stored?.theme) ? stored.theme : 'system'
}

export function windowBackground(): string {
  return nativeTheme.shouldUseDarkColors ? BACKGROUNDS.dark : BACKGROUNDS.light
}

// themeSource drives prefers-color-scheme in the page and the color of the Windows title bar.
export function applySavedTheme(): void {
  nativeTheme.themeSource = loadTheme()
}

export function registerThemeIpc(): void {
  ipcMain.handle(IPC.GET_THEME, (event) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    return loadTheme()
  })

  ipcMain.handle(IPC.SET_THEME, (event, theme: unknown) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    if (!isThemePreference(theme)) throw new Error('Invalid theme')
    nativeTheme.themeSource = theme
    writeJsonFile(THEME_FILE, { theme })
  })
}
