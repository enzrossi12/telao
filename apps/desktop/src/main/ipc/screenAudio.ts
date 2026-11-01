import { execFile } from 'child_process'
import { app, ipcMain, WebContents } from 'electron'
import { release } from 'os'
import { promisify } from 'util'
import type { LoopbackCapture } from 'loopback-capture'
import { IPC } from '../../shared/ipc'
import { isAppFrame } from './sender'

// WASAPI process loopback, which excludes a process, does not exist on older Windows builds.
const MIN_WINDOWS_BUILD = 20348

const DISCORD_PROCESS_QUERY = `ConvertTo-Json -Compress -InputObject @(
  Get-CimInstance Win32_Process -Filter "Name='Discord.exe' OR Name='DiscordPTB.exe' OR Name='DiscordCanary.exe'" |
  Select-Object ProcessId, ParentProcessId)`

interface ProcessEntry {
  ProcessId: number
  ParentProcessId: number
}

const execFileAsync = promisify(execFile)

let capture: LoopbackCapture | null = null

function isScreenAudioSupported(): boolean {
  return Number(release().split('.')[2]) >= MIN_WINDOWS_BUILD
}

// Excluding the root takes all of Discord's child processes with it. A failed query must reject:
// starting anyway would send the call to everyone watching.
async function findDiscordRootPid(): Promise<number | null> {
  const { stdout } = await execFileAsync('powershell.exe', [
    '-NoProfile',
    '-NonInteractive',
    '-Command',
    DISCORD_PROCESS_QUERY
  ])
  const processes = JSON.parse(stdout) as ProcessEntry[]
  const ids = new Set(processes.map(({ ProcessId }) => ProcessId))
  return processes.find(({ ParentProcessId }) => !ids.has(ParentProcessId))?.ProcessId ?? null
}

function stopScreenAudio(): void {
  capture?.stop()
  capture = null
}

async function startScreenAudio(sender: WebContents): Promise<void> {
  stopScreenAudio()

  const excludedPid = (await findDiscordRootPid()) ?? process.pid
  const { default: loopback } = await import('loopback-capture')
  const next = new loopback.LoopbackCapture()
  next.startSystemAudio((chunk) => {
    if (!sender.isDestroyed()) sender.send(IPC.SCREEN_AUDIO_CHUNK, chunk)
  }, excludedPid)
  capture = next
  sender.once('destroyed', stopScreenAudio)
}

export function registerScreenAudioIpc(): void {
  ipcMain.handle(IPC.IS_SCREEN_AUDIO_SUPPORTED, (event) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    return isScreenAudioSupported()
  })

  ipcMain.handle(IPC.START_SCREEN_AUDIO, (event) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    if (!isScreenAudioSupported()) throw new Error('Unsupported Windows build')
    return startScreenAudio(event.sender)
  })

  ipcMain.handle(IPC.STOP_SCREEN_AUDIO, (event) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    stopScreenAudio()
  })

  app.on('will-quit', stopScreenAudio)
}
