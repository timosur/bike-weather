const API_BASE = "/api";

export interface TokenResponse {
  access_token: string;
  id_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

export interface AuthError {
  detail: string;
}

async function authFetch<T>(path: string, body: Record<string, string>): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err: AuthError = await response.json().catch(() => ({ detail: "Request failed" }));
    throw new Error(err.detail || `Error ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export function login(username: string, password: string, captchaToken?: string): Promise<TokenResponse> {
  return authFetch<TokenResponse>("/auth/login", {
    username,
    password,
    ...(captchaToken ? { captcha_token: captchaToken } : {}),
  });
}

export interface MeResponse {
  id: number;
  email: string;
  name: string;
  is_admin: boolean;
}

export async function fetchMe(accessToken: string): Promise<MeResponse> {
  const response = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) {
    throw new Error("Failed to fetch user profile");
  }
  return response.json() as Promise<MeResponse>;
}

export function register(
  username: string,
  email: string,
  password: string,
  name?: string,
  captchaToken?: string,
): Promise<TokenResponse> {
  return authFetch<TokenResponse>("/auth/register", {
    username,
    email,
    password,
    ...(name ? { name } : {}),
    ...(captchaToken ? { captcha_token: captchaToken } : {}),
  });
}

export interface MessageResponse {
  message: string;
}

export async function forgotPassword(email: string, captchaToken?: string): Promise<MessageResponse> {
  return authFetch<MessageResponse>("/auth/forgot-password", {
    email,
    ...(captchaToken ? { captcha_token: captchaToken } : {}),
  });
}

export async function resetPassword(token: string, password: string): Promise<MessageResponse> {
  return authFetch<MessageResponse>("/auth/reset-password", {
    token,
    password,
  });
}
