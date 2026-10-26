import { ref } from 'vue'
import { apiUrl } from '@/api/http'

const cache = ref<Record<string, string | null>>({})
const inflight = new Map<string, Promise<string | null>>()

export async function persistBillLogo(billId: string, dataUrl: string | null): Promise<void> {
  const previous = cache.value[billId]
  if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous)
  cache.value[billId] = dataUrl
}

export function evictBillLogo(billId: string): void {
  const previous = cache.value[billId]
  if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous)
  delete cache.value[billId]
  inflight.delete(billId)
}

export async function loadBillLogo(key: string): Promise<string | null> {
  if (key in cache.value) return cache.value[key]

  const pending = inflight.get(key)
  if (pending) return pending

  const promise = fetch(apiUrl(`/api/bills/${key}/logo`), { credentials: 'include' })
    .then(async (response) => {
      if (!response.ok) {
        cache.value[key] = null
        return null
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      cache.value[key] = url
      return url
    })
    .catch(() => {
      cache.value[key] = null
      return null
    })
    .finally(() => {
      inflight.delete(key)
    })

  inflight.set(key, promise)
  return promise
}

export function peekBillLogo(key: string | null): string | null {
  if (!key) return null
  return cache.value[key] ?? null
}

export async function logoToDataUrl(key: string): Promise<string | null> {
  const cached = cache.value[key]
  if (cached?.startsWith('data:')) return cached
  const url = cached ?? (await loadBillLogo(key))
  if (!url) return null
  if (url.startsWith('data:')) return url
  const response = await fetch(url)
  const blob = await response.blob()
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(blob)
  })
}
