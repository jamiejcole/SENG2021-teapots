import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  signup as apiSignup,
  login as apiLogin,
  getUserProfile as apiGetUserProfile,
  type SignupRequest,
  type LoginRequest,
} from '@/api/auth'
import { type User, type AuthContextType, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from './authTypes'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

type JwtPayload = {
  exp?: number
}

function decodeTokenPayload(token: string): JwtPayload | null {
  const payload = token.split('.')[1]

  if (!payload) {
    return null
  }

  try {
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const paddedPayload = normalizedPayload.padEnd(Math.ceil(normalizedPayload.length / 4) * 4, '=')
    return JSON.parse(atob(paddedPayload)) as JwtPayload
  } catch {
    return null
  }
}

function getTokenExpiryTime(token: string): number | null {
  const payload = decodeTokenPayload(token)

  if (typeof payload?.exp !== 'number') {
    return null
  }

  return payload.exp * 1000
}

function clearStoredAuth() {
  localStorage.removeItem(AUTH_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load stored auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    let parsedUser: User | null = null

    if (storedToken) {
      const expiresAt = getTokenExpiryTime(storedToken)
      if (expiresAt === null || expiresAt <= Date.now()) {
        clearStoredAuth()
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsInitializing(false)
        return
      }
    }

    try {
      if (storedToken && storedUser) {
        parsedUser = JSON.parse(storedUser) as User
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAccessToken(storedToken)
        setUser(parsedUser)
      }
    } catch {
      // Invalid stored data, clear it
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }

    if (
      storedToken &&
      parsedUser &&
      (parsedUser.phone === undefined || parsedUser.company === undefined || parsedUser.businessAddress === undefined)
    ) {
      void apiGetUserProfile()
        .then((profile) => {
          const hydratedUser: User = {
            ...parsedUser,
            firstName: profile.firstName,
            lastName: profile.lastName,
            phone: profile.phone,
            company: profile.company,
            businessAddress: profile.businessAddress,
          }
          setUser(hydratedUser)
          localStorage.setItem(USER_KEY, JSON.stringify(hydratedUser))
        })
        .catch(() => {
          // Keep existing local user data if profile hydration fails.
        })
    }

    // Set initializing to false after state prep is complete
    setIsInitializing(false)
  }, [])

  useEffect(() => {
    if (!accessToken) {
      return
    }

    const expiresAt = getTokenExpiryTime(accessToken)
    if (expiresAt === null || expiresAt <= Date.now()) {
      clearStoredAuth()
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAccessToken(null)
      setUser(null)
      navigate('/auth/sign-in', { replace: true })
      return
    }

    const timeoutId = window.setTimeout(() => {
      clearStoredAuth()
      setAccessToken(null)
      setUser(null)
      navigate('/auth/sign-in', { replace: true })
    }, expiresAt - Date.now())

    return () => window.clearTimeout(timeoutId)
  }, [accessToken, navigate])

  const handleSignup = async (data: SignupRequest) => {
    setError(null)
    try {
      const result = await apiSignup(data)
      return result
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Signup failed'
      setError(message)
      throw err
    }
  }

  const handleLogin = async (data: LoginRequest) => {
    setError(null)
    try {
      const result = await apiLogin(data)
      const userData: User = {
        email: data.email,
        firstName: result.firstName,
        lastName: result.lastName,
        phone: result.phone,
        company: result.company,
        businessAddress: result.businessAddress,
      }

      setAccessToken(result.accessToken)
      setUser(userData)

      // Store tokens and user in localStorage
      localStorage.setItem(AUTH_TOKEN_KEY, result.accessToken)
      localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken)
      localStorage.setItem(USER_KEY, JSON.stringify(userData))
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed'
      setError(message)
      throw err
    }
  }

  const handleLogout = () => {
    setAccessToken(null)
    setUser(null)
    clearStoredAuth()
  }

  const handle2FAVerification = (
    tokens: { accessToken: string; refreshToken: string },
    userInfo: { email: string; firstName?: string; lastName?: string }
  ) => {
    const userData: User = {
      email: userInfo.email,
      firstName: userInfo.firstName,
      lastName: userInfo.lastName,
    }
    setAccessToken(tokens.accessToken)
    setUser(userData)
    localStorage.setItem(AUTH_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
  }

  const handleUpdateUserProfile = (updates: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...updates }
      setUser(updatedUser)
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser))
    }
  }

  const value: AuthContextType = {
    user,
    accessToken,
    isLoading: isInitializing,
    isAuthenticated: !!accessToken,
    signup: handleSignup,
    login: handleLogin,
    logout: handleLogout,
    handle2FAVerification,
    updateUserProfile: handleUpdateUserProfile,
    error,
    setError,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within a AuthProvider')
  }
  return context
}

// Re-export types for convenience
export type { User, AuthContextType }
