// IPC channel names, shared by main and preload. Each channel also declares its input/output types.
export const IPC = {
  LOAD_CREDENTIALS: 'credentials:load',
  SAVE_CREDENTIALS: 'credentials:save',
  LIST_SCREEN_SOURCES: 'screen:list-sources',
  SELECT_SCREEN_SOURCE: 'screen:select-source',
  IS_SCREEN_AUDIO_SUPPORTED: 'screen-audio:is-supported',
  START_SCREEN_AUDIO: 'screen-audio:start',
  STOP_SCREEN_AUDIO: 'screen-audio:stop',
  // Main to renderer: 16-bit PCM, stereo, 48 kHz.
  SCREEN_AUDIO_CHUNK: 'screen-audio:chunk'
} as const

export interface SavedCredentials {
  name: string
  password: string
}

export interface ScreenSource {
  id: string
  name: string
  kind: 'window' | 'screen'
  thumbnailDataUrl: string
  iconDataUrl: string | null
}
