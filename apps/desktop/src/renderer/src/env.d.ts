/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LIVEKIT_URL: string
  readonly VITE_TOKEN_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Chromium-only API, missing from TypeScript's DOM types.
declare class MediaStreamTrackGenerator extends MediaStreamTrack {
  constructor(init: { kind: 'audio' })
  readonly writable: WritableStream<AudioData>
}
