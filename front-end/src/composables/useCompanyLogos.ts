import { ref } from 'vue'
import { apiUrl } from '@/api/http'

const cache = ref<Record<string, string | null>>({})
const inflight = new Map<string, Promise<string | null>>()

export function evictCompanyLogo(companyId: string): void {
  const previous = cache.value[companyId]
  if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous)
  delete cache.value[companyId]
  inflight.delete(companyId)
}

export function clearCompanyLogos(): void {
  for (const value of Object.values(cache.value)) {
    if (value?.startsWith('blob:')) URL.revokeObjectURL(value)
  }
  cache.value = {}
  inflight.clear()
}

export function peekCompanyLogo(companyId: string | null): string | null {
  if (!companyId) return null
  return cache.value[companyId] ?? null
}

export function setCompanyLogoCache(companyId: string, dataUrl: string | null): void {
  const previous = cache.value[companyId]
  if (previous?.startsWith('blob:')) URL.revokeObjectURL(previous)
  cache.value[companyId] = dataUrl
}

export async function loadCompanyLogo(companyId: string): Promise<string | null> {
  if (companyId in cache.value) return cache.value[companyId]

  const pending = inflight.get(companyId)
  if (pending) return pending

  const promise = fetch(apiUrl(`/api/companies/${companyId}/logo`), {
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) {
        cache.value[companyId] = null
        return null
      }
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      cache.value[companyId] = url
      return url
    })
    .catch(() => {
      cache.value[companyId] = null
      return null
    })
    .finally(() => {
      inflight.delete(companyId)
    })

  inflight.set(companyId, promise)
  return promise
}

export async function companyLogoToDataUrl(companyId: string): Promise<string | null> {
  const cached = cache.value[companyId]
  if (cached?.startsWith('data:')) return cached
  const url = cached ?? (await loadCompanyLogo(companyId))
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
