import { createAuthClient } from 'better-auth/vue'
import { apiBaseUrl } from '@/api/apiBase'
import { beginLoading, endLoading } from '@/composables/useLoadingOverlay'

export const authClient = createAuthClient({
  baseURL: apiBaseUrl(),
  fetchOptions: {
    credentials: 'include',
    customFetchImpl: async (url, init) => {
      beginLoading()
      try {
        return await fetch(url, {
          ...init,
          credentials: 'include',
          signal: init?.signal ?? AbortSignal.timeout(8000),
        })
      } finally {
        endLoading()
      }
    },
  },
})
