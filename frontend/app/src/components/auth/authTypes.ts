import type { SignupRequest, LoginRequest } from '@/api/auth'

export type User = {
  email: string
  firstName?: string
  lastName?: string
}

export type AuthContextType = {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  isAuthenticated: boolean
  signup: (data: SignupRequest) => Promise<{ userId: string }>
  login: (data: LoginRequest) => Promise<void>
  logout: () => void
  handle2FAVerification: (
    tokens: { accessToken: string; refreshToken: string },
    userInfo: { email: string; firstName?: string; lastName?: string }
  ) => void
  error: string | null
  setError: (error: string | null) => void
}

export const AUTH_TOKEN_KEY = 'auth_access_token'
export const REFRESH_TOKEN_KEY = 'auth_refresh_token'
export const USER_KEY = 'auth_user'
