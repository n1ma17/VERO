import { computed, ref } from 'vue'
import { authClient } from '@/api/authClient'
import { clearWallet, hydrateWallet } from '@/composables/useWallet'
import type { AuthSession } from '@/types/auth'

export type AuthAttemptResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'exists' }

const session = ref<AuthSession | null>(null)
const ready = ref(false)
let boot: Promise<void> | null = null

function applyUser(user: { id: string; name: string; email: string } | null | undefined) {
  if (!user) {
    session.value = null
    return
  }
  session.value = {
    userId: user.id,
    name: user.name,
    email: user.email,
  }
}

export async function ensureAuthReady(): Promise<void> {
  if (ready.value) return
  if (!boot) {
    boot = (async () => {
      try {
        const { data } = await authClient.getSession()
        applyUser(data?.user)
        if (session.value) await hydrateWallet()
      } finally {
        ready.value = true
      }
    })()
  }
  await boot
}

export function useAuth() {
  const isAuthenticated = computed(() => session.value !== null)
  const currentUser = computed(() => session.value)

  async function login(email: string, password: string): Promise<AuthAttemptResult> {
    const { data, error } = await authClient.signIn.email({
      email: email.trim().toLowerCase(),
      password,
    })
    if (error || !data?.user) return { ok: false, reason: 'invalid' }
    applyUser(data.user)
    await hydrateWallet()
    return { ok: true }
  }

  async function register(input: {
    name: string
    email: string
    password: string
  }): Promise<AuthAttemptResult> {
    const { data, error } = await authClient.signUp.email({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
    })
    if (error) {
      const code = String(error.code ?? error.message ?? '').toUpperCase()
      if (code.includes('EXIST') || error.status === 422) {
        return { ok: false, reason: 'exists' }
      }
      return { ok: false, reason: 'invalid' }
    }
    if (!data?.user) return { ok: false, reason: 'invalid' }
    applyUser(data.user)
    await hydrateWallet()
    return { ok: true }
  }

  async function logout() {
    await authClient.signOut()
    session.value = null
    clearWallet()
  }

  return {
    isAuthenticated,
    currentUser,
    ready,
    login,
    register,
    logout,
  }
}
