import { BrowserWindow, Rectangle, screen } from 'electron'
import { readJsonFile, writeJsonFile } from './jsonFile'

const STATE_FILE = 'window-state.json'
const DEFAULT_SIZE = { width: 1100, height: 700 }

export const MIN_SIZE = { minWidth: 800, minHeight: 500 }

interface WindowState {
  bounds: Partial<Rectangle> & Pick<Rectangle, 'width' | 'height'>
  isMaximized: boolean
}

function isValidBounds(value: unknown): value is Rectangle {
  if (typeof value !== 'object' || value === null) return false
  const { x, y, width, height } = value as Record<string, unknown>
  return [x, y, width, height].every(Number.isFinite)
}

// A monitor may have been unplugged since the last run.
function isOnScreen({ x, y, width, height }: Rectangle): boolean {
  return screen.getAllDisplays().some(({ workArea }) => {
    const overlapWidth = Math.min(x + width, workArea.x + workArea.width) - Math.max(x, workArea.x)
    const overlapHeight =
      Math.min(y + height, workArea.y + workArea.height) - Math.max(y, workArea.y)
    return overlapWidth >= 100 && overlapHeight >= 100
  })
}

export function loadWindowState(): WindowState {
  const stored = readJsonFile(STATE_FILE) as { bounds?: unknown; isMaximized?: unknown } | null
  if (!stored || !isValidBounds(stored.bounds) || !isOnScreen(stored.bounds)) {
    return { bounds: DEFAULT_SIZE, isMaximized: false }
  }
  return { bounds: stored.bounds, isMaximized: stored.isMaximized === true }
}

export function saveWindowState(window: BrowserWindow): void {
  writeJsonFile(STATE_FILE, {
    bounds: window.getNormalBounds(),
    isMaximized: window.isMaximized()
  })
}
