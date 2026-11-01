// IPC channel names, shared by main and preload. Each channel also declares its input/output types.
export const IPC = {
  GET_APP_VERSION: 'app:get-version',
  LOAD_CREDENTIALS: 'credentials:load',
  SAVE_CREDENTIALS: 'credentials:save',
  LIST_SCREEN_SOURCES: 'screen:list-sources',
  SELECT_SCREEN_SOURCE: 'screen:select-source',
  GET_SCREEN_AUDIO_SUPPORT: 'screen-audio:get-support',
  START_SCREEN_AUDIO: 'screen-audio:start',
  STOP_SCREEN_AUDIO: 'screen-audio:stop',
  // Main to renderer: 16-bit PCM, stereo, 48 kHz.
  SCREEN_AUDIO_CHUNK: 'screen-audio:chunk'
} as const

export interface SavedCredentials {
  name: string
  password: string
}

// 'experimental': Windows 10 builds where process loopback works but is not officially supported.
export type ScreenAudioSupport = 'full' | 'experimental' | 'none'

export interface ScreenSource {
  id: string
  name: string
  kind: 'window' | 'screen'
  thumbnailDataUrl: string
  iconDataUrl: string | null
}
