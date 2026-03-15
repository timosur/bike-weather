import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react'
import { login as apiLogin, register as apiRegister, refreshToken as apiRefreshToken, fetchMe, type TokenResponse } from '../api/auth'

const STORAGE_KEY = 'bike-weather:auth'

interface StoredAuth {
  access_token: string
  id_token: string
  refresh_token: string | null
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
  login: (username: string, password: string, captchaToken?: string) => Promise<void>
  register: (username: string, email: string, password: string, name?: string, captchaToken?: string) => Promise<void>
  logout: () => void
  getAccessToken: () => Promise<string | null>
  refreshTokens: () => Promise<string | null>
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
    refresh_token: tokens.refresh_token ?? null,
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
    // Keep stored auth if refresh token exists, even if access token expired
    if (stored.expires_at < Date.now() && !stored.refresh_token) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return stored
  } catch {
    localStorage.removeItem(STORAGE_KEY)
    return null
  }
}

// Module-level mutex to prevent concurrent refresh requests
let _refreshPromise: Promise<string | null> | null = null

async function _doRefreshTokens(
  rt: string,
  setUser: (u: UserProfile | null) => void,
  doLogout: () => void,
): Promise<string | null> {
  try {
    const tokens = await apiRefreshToken(rt)
    const stored = storeTokens(tokens)
    setUser(stored.profile)
    // Update admin flag from backend
    try {
      const me = await fetchMe(tokens.access_token)
      if (me.is_admin !== stored.profile.isAdmin) {
        const updated = storeTokens(tokens, me.is_admin)
        setUser(updated.profile)
      }
    } catch { /* profile from JWT is used as fallback */ }
    return tokens.access_token
  } catch {
    doLogout()
    return null
  } finally {
    _refreshPromise = null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearRefreshTimer = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current)
      refreshTimerRef.current = null
    }
  }, [])

  const logout = useCallback(() => {
    clearRefreshTimer()
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
  }, [clearRefreshTimer])

  const scheduleProactiveRefresh = useCallback((expiresAt: number) => {
    clearRefreshTimer()
    const msUntilExpiry = expiresAt - Date.now()
    // Refresh at 80% of token lifetime, minimum 10 seconds from now
    const refreshIn = Math.max(msUntilExpiry * 0.8, 10_000)
    refreshTimerRef.current = setTimeout(() => {
      const stored = loadStoredAuth()
      if (stored?.refresh_token) {
        // Fire-and-forget; _doRefreshTokens handles errors
        _refreshPromise = _refreshPromise ?? _doRefreshTokens(stored.refresh_token, setUser, logout)
        _refreshPromise.then(() => {
          // Re-schedule with the new token's expiry
          const updated = loadStoredAuth()
          if (updated && updated.expires_at > Date.now()) {
            scheduleProactiveRefresh(updated.expires_at)
          }
        })
      }
    }, refreshIn)
  }, [clearRefreshTimer, logout])

  const refreshTokens = useCallback(async (): Promise<string | null> => {
    const stored = loadStoredAuth()
    if (!stored?.refresh_token) return null
    _refreshPromise = _refreshPromise ?? _doRefreshTokens(stored.refresh_token, setUser, logout)
    return _refreshPromise
  }, [logout])

  // Startup: restore session, attempt refresh if access token expired
  useEffect(() => {
    let cancelled = false
    async function init() {
      const stored = loadStoredAuth()
      if (!stored) {
        setIsLoading(false)
        return
      }

      if (stored.expires_at > Date.now()) {
        // Access token still valid
        setUser(stored.profile)
        scheduleProactiveRefresh(stored.expires_at)
        // Refresh is_admin from backend
        try {
          const me = await fetchMe(stored.access_token)
          if (!cancelled && me.is_admin !== stored.profile.isAdmin) {
            const updated = storeTokens(
              { access_token: stored.access_token, id_token: stored.id_token, refresh_token: stored.refresh_token ?? undefined, token_type: 'Bearer', expires_in: Math.round((stored.expires_at - Date.now()) / 1000), scope: '' },
              me.is_admin,
            )
            setUser(updated.profile)
          }
        } catch { /* use cached profile */ }
      } else if (stored.refresh_token) {
        // Access token expired but refresh token exists — try to refresh
        const newToken = await _doRefreshTokens(stored.refresh_token, setUser, () => {
          localStorage.removeItem(STORAGE_KEY)
          if (!cancelled) setUser(null)
        })
        if (newToken && !cancelled) {
          const updated = loadStoredAuth()
          if (updated) {
            scheduleProactiveRefresh(updated.expires_at)
          }
        }
      } else {
        // No refresh token and access token expired — clear
        localStorage.removeItem(STORAGE_KEY)
      }

      if (!cancelled) setIsLoading(false)
    }
    init()
    return () => { cancelled = true }
  }, [scheduleProactiveRefresh])

  const login = useCallback(async (username: string, password: string, captchaToken?: string) => {
    const tokens = await apiLogin(username, password, captchaToken)
    const stored = storeTokens(tokens)
    setUser(stored.profile)
    scheduleProactiveRefresh(stored.expires_at)
    // Fetch authoritative profile from backend (includes is_admin from DB)
    try {
      const me = await fetchMe(tokens.access_token)
      const updated = storeTokens(tokens, me.is_admin)
      setUser(updated.profile)
    } catch { /* profile from JWT is used as fallback */ }
  }, [scheduleProactiveRefresh])

  const register = useCallback(async (username: string, email: string, password: string, name?: string, captchaToken?: string) => {
    const tokens = await apiRegister(username, email, password, name, captchaToken)
    const stored = storeTokens(tokens)
    setUser(stored.profile)
    scheduleProactiveRefresh(stored.expires_at)
    try {
      const me = await fetchMe(tokens.access_token)
      const updated = storeTokens(tokens, me.is_admin)
      setUser(updated.profile)
    } catch { /* profile from JWT is used as fallback */ }
  }, [scheduleProactiveRefresh])

  const getAccessToken = useCallback(async () => {
    const stored = loadStoredAuth()
    if (!stored) return null
    // If access token is still valid, return it
    if (stored.expires_at > Date.now()) {
      return stored.access_token
    }
    // Access token expired — try refresh
    if (stored.refresh_token) {
      return refreshTokens()
    }
    // No refresh token available
    logout()
    return null
  }, [refreshTokens, logout])

  // Clean up timer on unmount
  useEffect(() => clearRefreshTimer, [clearRefreshTimer])

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
        refreshTokens,
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
