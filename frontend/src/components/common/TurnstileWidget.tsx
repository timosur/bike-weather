import { useEffect, useRef, useCallback } from 'react'

const TURNSTILE_SCRIPT_ID = 'cf-turnstile-script'
const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: TurnstileRenderOptions) => string
      reset: (widgetId: string) => void
      remove: (widgetId: string) => void
    }
  }
}

interface TurnstileRenderOptions {
  sitekey: string
  callback: (token: string) => void
  'expired-callback'?: () => void
  'error-callback'?: () => void
  theme?: 'light' | 'dark' | 'auto'
  size?: 'normal' | 'compact'
  language?: string
}

export interface TurnstileWidgetProps {
  /** Called with the verification token when the user passes the challenge */
  onVerify: (token: string) => void
  /** Called when the token expires */
  onExpire?: () => void
  /** Called on error */
  onError?: () => void
  /** Theme: auto follows system preference */
  theme?: 'light' | 'dark' | 'auto'
  /** Size variant */
  size?: 'normal' | 'compact'
  /** Additional CSS classes for the container */
  className?: string
}

function loadTurnstileScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.getElementById(TURNSTILE_SCRIPT_ID)) {
      if (window.turnstile) {
        resolve()
      } else {
        // Script tag exists but hasn't loaded yet — wait for it
        const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement
        existing.addEventListener('load', () => resolve())
        existing.addEventListener('error', () => reject(new Error('Failed to load Turnstile')))
      }
      return
    }

    const script = document.createElement('script')
    script.id = TURNSTILE_SCRIPT_ID
    script.src = TURNSTILE_SCRIPT_URL
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Turnstile'))
    document.head.appendChild(script)
  })
}

import { getConfig } from '../../config'

const SITE_KEY = getConfig('VITE_TURNSTILE_SITE_KEY')

export function TurnstileWidget({
  onVerify,
  onExpire,
  onError,
  theme = 'auto',
  size = 'normal',
  className = '',
}: TurnstileWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const widgetIdRef = useRef<string | null>(null)

  const onVerifyRef = useRef(onVerify)
  onVerifyRef.current = onVerify
  const onExpireRef = useRef(onExpire)
  onExpireRef.current = onExpire
  const onErrorRef = useRef(onError)
  onErrorRef.current = onError

  useEffect(() => {
    if (!SITE_KEY) return

    let cancelled = false

    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return

      // Clear any previous widget
      if (widgetIdRef.current) {
        try { window.turnstile.remove(widgetIdRef.current) } catch { /* noop */ }
      }

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: SITE_KEY,
        callback: (token: string) => onVerifyRef.current(token),
        'expired-callback': () => onExpireRef.current?.(),
        'error-callback': () => onErrorRef.current?.(),
        theme,
        size,
      })
    })

    return () => {
      cancelled = true
      if (widgetIdRef.current && window.turnstile) {
        try { window.turnstile.remove(widgetIdRef.current) } catch { /* noop */ }
        widgetIdRef.current = null
      }
    }
  }, [theme, size])

  const reset = useCallback(() => {
    if (widgetIdRef.current && window.turnstile) {
      window.turnstile.reset(widgetIdRef.current)
    }
  }, [])

  if (!SITE_KEY) return null

  return <div ref={containerRef} className={className} data-turnstile-reset={reset} />
}

/** Hook to manage Turnstile token state */
export function useTurnstile() {
  const tokenRef = useRef<string | null>(null)

  const onVerify = useCallback((token: string) => {
    tokenRef.current = token
  }, [])

  const onExpire = useCallback(() => {
    tokenRef.current = null
  }, [])

  const getToken = useCallback(() => tokenRef.current, [])

  const clearToken = useCallback(() => {
    tokenRef.current = null
  }, [])

  return { onVerify, onExpire, getToken, clearToken }
}
