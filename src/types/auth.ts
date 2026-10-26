export interface AuthUser {
  id: string
  name: string
  email: string
  passwordHash: string
  createdAt: string
}

export interface AuthSession {
  userId: string
  name: string
  email: string
}

export type AuthMode = 'login' | 'register'

export type AuthOutcome = 'idle' | 'pending' | 'success' | 'rejected'
