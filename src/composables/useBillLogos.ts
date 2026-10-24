import { ref } from 'vue'
import { deleteBillLogo, getBillLogo, setBillLogo } from '@/utils/billLogoStore'

const cache = ref<Record<string, string | null>>({})
const inflight = new Map<string, Promise<string | null>>()

export async function persistBillLogo(billId: string, dataUrl: string | null): Promise<void> {
  if (dataUrl) {
    await setBillLogo(billId, dataUrl)
    cache.value[billId] = dataUrl
    return
  }
  await deleteBillLogo(billId)
  cache.value[billId] = null
}

export async function loadBillLogo(key: string): Promise<string | null> {
  if (key in cache.value) return cache.value[key]

  const pending = inflight.get(key)
  if (pending) return pending

  const promise = getBillLogo(key).then((url) => {
    cache.value[key] = url
    inflight.delete(key)
    return url
  })
  inflight.set(key, promise)
  return promise
}

export function peekBillLogo(key: string | null): string | null {
  if (!key) return null
  return cache.value[key] ?? null
}
