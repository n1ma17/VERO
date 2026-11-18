import { beginLoading, endLoading } from '@/composables/useLoadingOverlay'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export class NetworkError extends Error {
  constructor(message = 'Network request failed') {
    super(message)
    this.name = 'NetworkError'
  }
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`
}

export function isNetworkError(error: unknown): boolean {
  return error instanceof NetworkError
}

export function isAuthError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.status === 403)
}

export function isValidationError(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 400 || error.status === 422)
}

export function isTransientHttpError(error: unknown): boolean {
  return (
    error instanceof ApiError &&
    (error.status === 408 || error.status === 429 || error.status >= 500)
  )
}

export function isOfflineFailure(error: unknown): boolean {
  return isNetworkError(error) || isTransientHttpError(error)
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  let response: Response
  beginLoading()
  try {
    const timeout = AbortSignal.timeout(8000)
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout
    response = await fetch(apiUrl(path), {
      ...init,
      credentials: 'include',
      headers,
      signal,
    })
  } catch {
    throw new NetworkError()
  } finally {
    endLoading()
  }

  if (response.status === 204) return undefined as T

  if (!response.ok) {
    let message = response.statusText
    try {
      const body = (await response.json()) as { message?: string | string[] }
      if (Array.isArray(body.message)) message = body.message.join(', ')
      else if (body.message) message = body.message
    } catch {
      /* ignore */
    }
    throw new ApiError(response.status, message)
  }

  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return undefined as T
  return (await response.json()) as T
}
