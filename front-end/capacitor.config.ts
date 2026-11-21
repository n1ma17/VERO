import type { CapacitorConfig } from '@capacitor/cli'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Capacitor Android defaults to https://localhost, which blocks cleartext
 * calls to a LAN HTTP API (mixed content) and breaks cookie SameSite vs a
 * different host. Match the WebView host to VITE_API_URL's hostname so
 * http://<lan-ip> → http://<lan-ip>:3000 stays same-site.
 */
function apiHostname(): string {
  try {
    const envPath = resolve(__dirname, '.env')
    const line = readFileSync(envPath, 'utf8')
      .split(/\r?\n/)
      .find((row) => row.startsWith('VITE_API_URL='))
    if (!line) return 'localhost'
    const raw = line.slice('VITE_API_URL='.length).trim()
    return new URL(raw).hostname || 'localhost'
  } catch {
    return 'localhost'
  }
}

const hostname = apiHostname()

const config: CapacitorConfig = {
  appId: 'com.ouvina.app',
  appName: 'OUVINA',
  webDir: 'dist',
  server: {
    androidScheme: 'http',
    hostname,
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
}

export default config
