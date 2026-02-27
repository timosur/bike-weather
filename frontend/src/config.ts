/**
 * Runtime configuration reader.
 *
 * In production (Docker/K8s), config.js is generated at container startup by
 * docker-entrypoint.sh and sets window.__RUNTIME_CONFIG__.
 *
 * In local dev, values come from Vite's import.meta.env (loaded from .env).
 */

interface RuntimeConfig {
  VITE_AUTHENTIK_URL?: string
  VITE_AUTHENTIK_CLIENT_ID?: string
  VITE_TURNSTILE_SITE_KEY?: string
}

declare global {
  interface Window {
    __RUNTIME_CONFIG__?: RuntimeConfig
  }
}

export function getConfig(key: keyof RuntimeConfig): string {
  const runtime = window.__RUNTIME_CONFIG__
  if (runtime && key in runtime) {
    return runtime[key] || ''
  }
  return (import.meta.env[key] as string) || ''
}
