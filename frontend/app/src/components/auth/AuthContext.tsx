import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { signup as apiSignup, login as apiLogin, type SignupRequest, type LoginRequest } from '@/api/auth'
import { type User, type AuthContextType, AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY } from './authTypes'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Load stored auth on mount
  useEffect(() => {
    const storedToken = localStorage.getItem(AUTH_TOKEN_KEY)
    const storedUser = localStorage.getItem(USER_KEY)
    
    try {
      if (storedToken && storedUser) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAccessToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    } catch {
      // Invalid stored data, clear it
      localStorage.removeItem(AUTH_TOKEN_KEY)
      localStorage.removeItem(REFRESH_TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }
    
    // Set initializing to false after state prep is complete
    setIsInitializing(false)
  }, [])

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
      const userData: User = { email: data.email }

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
    localStorage.removeItem(AUTH_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  const handle2FAVerification = (tokens: { accessToken: string; refreshToken: string }, email: string) => {
    const userData: User = { email }
    setAccessToken(tokens.accessToken)
    setUser(userData)
    localStorage.setItem(AUTH_TOKEN_KEY, tokens.accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
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
