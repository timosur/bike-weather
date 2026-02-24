import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, type TokenResponse } from '../api/auth'

const STORAGE_KEY = 'bike-weather:auth'

interface StoredAuth {
  access_token: string
  id_token: string
  expires_at: number // epoch ms
  profile: UserProfile
}

export interface UserProfile {
  sub: string
  email: string
  name: string
}

interface AuthContextValue {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name?: string) => Promise<void>
  logout: () => void
  getAccessToken: () => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function parseJwt(token: string): Record<string, unknown> {
  const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')
  return JSON.parse(atob(base64))
}

function profileFromIdToken(idToken: string): UserProfile {
  const claims = parseJwt(idToken)
  return {
    sub: (claims.sub as string) ?? '',
    email: (claims.email as string) ?? '',
    name: (claims.name as string) ?? (claims.preferred_username as string) ?? '',
  }
}

function storeTokens(tokens: TokenResponse): StoredAuth {
  const profile = profileFromIdToken(tokens.id_token)
  const stored: StoredAuth = {
    access_token: tokens.access_token,
    id_token: tokens.id_token,
    expires_at: Date.now() + tokens.expires_in * 1000,
    profile,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  return stored
}

function loadStoredAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const stored: StoredAuth = JSON.parse(raw)
    if (stored.expires_at < Date.now()) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return stored
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const stored = loadStoredAuth()
    if (stored) {
      setUser(stored.profile)
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    const tokens = await apiLogin(email, password)
    const stored = storeTokens(tokens)
    setUser(stored.profile)
  }, [])

  const register = useCallback(async (email: string, password: string, name?: string) => {
    const tokens = await apiRegister(email, password, name)
    const stored = storeTokens(tokens)
    setUser(stored.profile)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [])

  const getAccessToken = useCallback(async () => {
    const stored = loadStoredAuth()
    return stored?.access_token ?? null
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        register,
        logout,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
