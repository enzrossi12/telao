declare namespace NodeJS {
  interface ProcessEnv {
    LIVEKIT_API_KEY?: string
    LIVEKIT_API_SECRET?: string
    GROUP_PASSWORD?: string
    ROOM_NAME?: string
    // Injected by the Upstash integration; older Vercel KV stores use the KV_ names.
    UPSTASH_REDIS_REST_URL?: string
    UPSTASH_REDIS_REST_TOKEN?: string
    KV_REST_API_URL?: string
    KV_REST_API_TOKEN?: string
  }
}
