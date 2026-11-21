import { Capacitor } from '@capacitor/core'

/**
 * Browser talks same-origin (`/api/...`) so Better Auth's SameSite=Lax
 * session cookie is stored and sent. Cross-host calls
 * (localhost → 192.168.x.x) get a 200 on sign-in but 401 on everything else.
 *
 * Capacitor WebView uses the LAN host from VITE_API_URL (matched in
 * capacitor.config.ts) so cookies stay first-party there too.
 */
export function apiBaseUrl(): string {
  if (Capacitor.isNativePlatform()) {
    return import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
  }
  return ''
}
