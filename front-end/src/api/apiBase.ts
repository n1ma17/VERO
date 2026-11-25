/** Injected on device by Capacitor — do not import `@capacitor/core` (Rollup folds it to web). */
type CapacitorGlobal = {
  isNativePlatform?: () => boolean
  getPlatform?: () => string
}

function capacitorBridge(): CapacitorGlobal | undefined {
  return (globalThis as { Capacitor?: CapacitorGlobal }).Capacitor
}

function isPrivateLanHost(hostname: string): boolean {
  return /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)
}

function isCapacitorNative(): boolean {
  const cap = capacitorBridge()
  if (!cap) return false
  if (cap.isNativePlatform?.()) return true
  const platform = cap.getPlatform?.()
  return platform === 'android' || platform === 'ios'
}

/**
 * Browser (Vite): same-origin `/api`.
 * Capacitor WebView: Nest on the same LAN host, port 3000 (`http://192.168.x.x/` → `:3000`).
 */
export function apiBaseUrl(): string {
  if (typeof window === 'undefined') return ''

  const { hostname, port, protocol } = window.location

  if (hostname === 'localhost' || hostname === '127.0.0.1') return ''

  const onCapacitorWebView =
    isCapacitorNative() ||
    (isPrivateLanHost(hostname) && (port === '' || port === '80' || port === '443'))

  if (!onCapacitorWebView) return ''

  const fromEnv = import.meta.env.VITE_API_URL as string | undefined
  if (fromEnv) return fromEnv.replace(/\/$/, '')

  return `${protocol}//${hostname}:3000`
}