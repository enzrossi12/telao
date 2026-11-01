import { execFile } from 'child_process'
import { app, ipcMain, WebContents } from 'electron'
import { release } from 'os'
import { promisify } from 'util'
import type { LoopbackCapture } from 'loopback-capture'
import { IPC, ScreenAudioSupport } from '../../shared/ipc'
import { isAppFrame } from './sender'

// WASAPI process loopback, which excludes a process, is documented from build 20348 on and is
// reported to work from Windows 10 2004. Older builds would fail to activate it.
const OFFICIAL_WINDOWS_BUILD = 20348
const MIN_WINDOWS_BUILD = 19041

const DISCORD_PROCESS_QUERY = `ConvertTo-Json -Compress -InputObject @(
  Get-CimInstance Win32_Process -Filter "Name='Discord.exe' OR Name='DiscordPTB.exe' OR Name='DiscordCanary.exe'" |
  Select-Object ProcessId, ParentProcessId)`

interface ProcessEntry {
  ProcessId: number
  ParentProcessId: number
}

const execFileAsync = promisify(execFile)

let capture: LoopbackCapture | null = null

function getScreenAudioSupport(): ScreenAudioSupport {
  const build = Number(release().split('.')[2])
  if (build >= OFFICIAL_WINDOWS_BUILD) return 'full'
  return build >= MIN_WINDOWS_BUILD ? 'experimental' : 'none'
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
  ipcMain.handle(IPC.GET_SCREEN_AUDIO_SUPPORT, (event) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    return getScreenAudioSupport()
  })

  ipcMain.handle(IPC.START_SCREEN_AUDIO, (event) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    if (getScreenAudioSupport() === 'none') throw new Error('Unsupported Windows build')
    return startScreenAudio(event.sender)
  })

  ipcMain.handle(IPC.STOP_SCREEN_AUDIO, (event) => {
    if (!isAppFrame(event)) throw new Error('Untrusted sender')
    stopScreenAudio()
  })

  app.on('will-quit', stopScreenAudio)
}
