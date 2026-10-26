import { computed, ref, watch } from 'vue'
import type { AuthSession, AuthUser } from '@/types/auth'
import { hashSecret } from '@/utils/hashSecret'

const USERS_KEY = 'money-managment:users'
const SESSION_KEY = 'money-managment:session'

export type AuthAttemptResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'exists' }

function loadUsers(): AuthUser[] {
  try {
    const raw = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]') as AuthUser[]
    return Array.isArray(raw) ? raw : []
  } catch {
    return []
  }
}

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    const session = JSON.parse(raw) as AuthSession
    if (!session.userId || !session.email) return null
    return session
  } catch {
    return null
  }
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

const users = ref<AuthUser[]>(loadUsers())
const session = ref<AuthSession | null>(loadSession())

watch(users, (value) => localStorage.setItem(USERS_KEY, JSON.stringify(value)), { deep: true })
watch(session, (value) => {
  if (value) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(value))
    return
  }
  localStorage.removeItem(SESSION_KEY)
})

function findByEmail(email: string): AuthUser | undefined {
  return users.value.find((user) => user.email === email)
}

function openSession(user: AuthUser) {
  session.value = {
    userId: user.id,
    name: user.name,
    email: user.email,
  }
}

export function useAuth() {
  const isAuthenticated = computed(() => session.value !== null)
  const currentUser = computed(() => session.value)

  async function login(email: string, password: string): Promise<AuthAttemptResult> {
    const normalized = normalizeEmail(email)
    const user = findByEmail(normalized)
    if (!user) return { ok: false, reason: 'invalid' }

    const passwordHash = await hashSecret(password)
    if (passwordHash !== user.passwordHash) return { ok: false, reason: 'invalid' }

    openSession(user)
    return { ok: true }
  }

  async function register(input: {
    name: string
    email: string
    password: string
  }): Promise<AuthAttemptResult> {
    const email = normalizeEmail(input.email)
    if (findByEmail(email)) return { ok: false, reason: 'exists' }

    const user: AuthUser = {
      id: crypto.randomUUID(),
      name: input.name.trim(),
      email,
      passwordHash: await hashSecret(input.password),
      createdAt: new Date().toISOString(),
    }
    users.value = [...users.value, user]
    openSession(user)
    return { ok: true }
  }

  function logout() {
    session.value = null
  }

  return {
    isAuthenticated,
    currentUser,
    login,
    register,
    logout,
  }
}
