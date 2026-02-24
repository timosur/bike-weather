const API_BASE = '/api'

export interface TokenResponse {
  access_token: string
  id_token: string
  token_type: string
  expires_in: number
  scope: string
}

export interface AuthError {
  detail: string
}

async function authFetch<T>(path: string, body: Record<string, string>): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err: AuthError = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(err.detail || `Error ${response.status}`)
  }

  return response.json() as Promise<T>
}

export function login(email: string, password: string): Promise<TokenResponse> {
  return authFetch<TokenResponse>('/auth/login', { email, password })
}

export function register(email: string, password: string, name?: string): Promise<TokenResponse> {
  return authFetch<TokenResponse>('/auth/register', {
    email,
    password,
    ...(name ? { name } : {}),
  })
}
