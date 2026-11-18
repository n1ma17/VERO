import { createAuthClient } from 'better-auth/vue'
import { beginLoading, endLoading } from '@/composables/useLoadingOverlay'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3000',
  fetchOptions: {
    customFetchImpl: async (url, init) => {
      beginLoading()
      try {
        return await fetch(url, {
          ...init,
          signal: init?.signal ?? AbortSignal.timeout(8000),
        })
      } finally {
        endLoading()
      }
    },
  },
})
