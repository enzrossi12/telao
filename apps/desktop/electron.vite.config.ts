import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'

// Writes VITE_TOKEN_URL into the CSP of index.html. An unset variable leaves it out of the policy.
function cspTokenUrl(): Plugin {
  let tokenUrl = ''
  return {
    name: 'telao:csp-token-url',
    configResolved(config) {
      tokenUrl = config.env.VITE_TOKEN_URL ?? ''
    },
    transformIndexHtml(html) {
      return html.replace('__VITE_TOKEN_URL__', tokenUrl)
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
    plugins: [react(), cspTokenUrl()]
  }
})
