const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function apiUrl(path: string): string {
  return `${API_URL}${path}`
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(apiUrl(path), {
    ...init,
    credentials: 'include',
    headers,
  })

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
