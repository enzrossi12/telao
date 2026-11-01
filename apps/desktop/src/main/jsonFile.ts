import { app } from 'electron'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export function readJsonFile(name: string): unknown {
  try {
    return JSON.parse(readFileSync(join(app.getPath('userData'), name), 'utf8'))
  } catch {
    return null
  }
}

export function writeJsonFile(name: string, data: unknown): void {
  writeFileSync(join(app.getPath('userData'), name), JSON.stringify(data))
}
