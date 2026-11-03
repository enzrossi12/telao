import { useEffect, useState } from 'react'
import { THEME_PREFERENCES, ThemePreference } from '../../../shared/ipc'

export interface UseTheme {
  // Null until the saved choice arrives from the main process.
  theme: ThemePreference | null
  cycleTheme: () => void
}

export function useTheme(): UseTheme {
  const [theme, setTheme] = useState<ThemePreference | null>(null)

  useEffect(() => {
    window.telao.getTheme().then(setTheme)
  }, [])

  const cycleTheme = (): void => {
    if (!theme) return
    const next =
      THEME_PREFERENCES[(THEME_PREFERENCES.indexOf(theme) + 1) % THEME_PREFERENCES.length]
    setTheme(next)
    window.telao.setTheme(next)
  }

  return { theme, cycleTheme }
}
