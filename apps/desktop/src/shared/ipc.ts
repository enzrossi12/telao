// IPC channel names, shared by main and preload. Each channel also declares its input/output types.
export const IPC = {
  LOAD_CREDENTIALS: 'credentials:load',
  SAVE_CREDENTIALS: 'credentials:save'
} as const

export interface SavedCredentials {
  name: string
  password: string
}
