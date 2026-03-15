import i18n from "../i18n";

const API_BASE = "/api";

type AccessTokenProvider = () => Promise<string | null>;
type TokenRefresher = () => Promise<string | null>;

let _getAccessToken: AccessTokenProvider | null = null;
let _refreshTokens: TokenRefresher | null = null;

export function setAccessTokenProvider(provider: AccessTokenProvider): void {
  _getAccessToken = provider;
}

export function getAccessTokenProvider(): AccessTokenProvider | null {
  return _getAccessToken;
}

export function setTokenRefresher(refresher: TokenRefresher): void {
  _refreshTokens = refresher;
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

  if (response.status === 401 && _refreshTokens) {
    // Attempt token refresh and retry once
    const newToken = await _refreshTokens();
    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      const retryResponse = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
          ...headers,
          ...(options?.headers as Record<string, string>),
        },
      });

      if (!retryResponse.ok) {
        throw new Error(`API error: ${retryResponse.status} ${retryResponse.statusText}`);
      }

      if (retryResponse.status === 204) {
        return undefined as T;
      }

      return retryResponse.json() as Promise<T>;
    }
    throw new Error("Unauthorized");
  }

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
