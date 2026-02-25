import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, fetchMe, type TokenResponse } from '../api/auth'

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
  isAdmin: boolean
}

interface AuthContextValue {
  user: UserProfile | null
  isLoading: boolean
  isAuthenticated: boolean
  isAdmin: boolean
  login: (username: string, password: string) => Promise<void>
  register: (username: string, email: string, password: string, name?: string) => Promise<void>
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
    isAdmin: (claims.is_admin as boolean) ?? false,
  }
}

function storeTokens(tokens: TokenResponse, adminOverride?: boolean): StoredAuth {
  const profile = profileFromIdToken(tokens.id_token)
  if (adminOverride !== undefined) {
    profile.isAdmin = adminOverride
  }
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
      // Refresh is_admin from backend on app start
      fetchMe(stored.access_token)
        .then(me => {
          if (me.is_admin !== stored.profile.isAdmin) {
            const updated = storeTokens(
              { access_token: stored.access_token, id_token: stored.id_token, token_type: 'Bearer', expires_in: Math.round((stored.expires_at - Date.now()) / 1000), scope: '' },
              me.is_admin,
            )
            setUser(updated.profile)
          }
        })
        .catch(() => { /* use cached profile */ })
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (username: string, password: string) => {
    const tokens = await apiLogin(username, password)
    const stored = storeTokens(tokens)
    setUser(stored.profile)
    // Fetch authoritative profile from backend (includes is_admin from DB)
    try {
      const me = await fetchMe(tokens.access_token)
      const updated = storeTokens(tokens, me.is_admin)
      setUser(updated.profile)
    } catch { /* profile from JWT is used as fallback */ }
  }, [])

  const register = useCallback(async (username: string, email: string, password: string, name?: string) => {
    const tokens = await apiRegister(username, email, password, name)
    const stored = storeTokens(tokens)
    setUser(stored.profile)
    try {
      const me = await fetchMe(tokens.access_token)
      const updated = storeTokens(tokens, me.is_admin)
      setUser(updated.profile)
    } catch { /* profile from JWT is used as fallback */ }
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
        isAdmin: user?.isAdmin ?? false,
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

/** Stub for OIDC callback – will be implemented when Authentik integration is wired up. */
export async function handleOidcCallback(): Promise<void> {
  // TODO: exchange authorization code for tokens via backend
  throw new Error('OIDC callback not yet implemented')
}
