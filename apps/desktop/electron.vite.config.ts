import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Writes the service's /api/ folder into the CSP of index.html, taken from VITE_TOKEN_URL. An unset
// variable leaves it out of the policy.
function cspTokenApi(): Plugin {
  let tokenApi = ''
  return {
    name: 'telao:csp-token-api',
    configResolved(config) {
      const { VITE_TOKEN_URL } = config.env
      tokenApi = VITE_TOKEN_URL ? new URL('/api/', VITE_TOKEN_URL).href : ''
    },
    transformIndexHtml(html) {
      return html.replace('__VITE_TOKEN_API__', tokenApi)
    }
  }
}

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), cspTokenApi()]
  }
})
