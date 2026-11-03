import { ReactNode } from 'react'
import { Monitor, Moon, Sun } from 'lucide-react'
import { ThemePreference } from '../../../shared/ipc'
import { useTheme } from '../hooks/useTheme'
import IconButton from './IconButton'

const OPTIONS: Record<ThemePreference, { label: string; icon: ReactNode }> = {
  system: { label: 'Tema automático', icon: <Monitor size={18} /> },
  light: { label: 'Tema claro', icon: <Sun size={18} /> },
  dark: { label: 'Tema escuro', icon: <Moon size={18} /> }
}

// Each click moves to the next option: automático (follows Windows), claro, escuro.
function ThemeToggle(): React.JSX.Element | null {
  const { theme, cycleTheme } = useTheme()
  if (!theme) return null
  const { label, icon } = OPTIONS[theme]

  return <IconButton label={label} icon={icon} className="theme-toggle" onClick={cycleTheme} />
}

export default ThemeToggle
