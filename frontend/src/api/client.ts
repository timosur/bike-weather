import i18n from "../i18n";

const API_BASE = "/api";

type AccessTokenProvider = () => Promise<string | null>;

let _getAccessToken: AccessTokenProvider | null = null;

export function setAccessTokenProvider(provider: AccessTokenProvider): void {
  _getAccessToken = provider;
}

export function getAccessTokenProvider(): AccessTokenProvider | null {
  return _getAccessToken;
}

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language": i18n.language,
  };

  if (_getAccessToken) {
    const token = await _getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...headers,
      ...(options?.headers as Record<string, string>),
    },
  });

  if (response.status === 401) {
    throw new Error("Unauthorized");
  }

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }

  // 204 No Content — nothing to parse
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
