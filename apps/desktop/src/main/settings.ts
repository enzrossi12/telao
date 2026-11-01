import { readJsonFile, writeJsonFile } from './jsonFile'

const SETTINGS_FILE = 'settings.json'

export interface AppSettings {
  shareShortcutEnabled: boolean
}

export function loadSettings(): AppSettings {
  const stored = readJsonFile(SETTINGS_FILE) as Partial<AppSettings> | null
  return { shareShortcutEnabled: stored?.shareShortcutEnabled === true }
}

export function saveSettings(settings: AppSettings): void {
  writeJsonFile(SETTINGS_FILE, settings)
}
