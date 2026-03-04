import { getWebInstrumentations, initializeFaro, type Faro } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'
import { ReactIntegration, createReactRouterV6Options } from '@grafana/faro-react'
import { createRoutesFromChildren, matchRoutes, Routes, useLocation, useNavigationType } from 'react-router-dom'
import { getConfig } from './config'

export let faro: Faro | null = null

const collectorUrl = getConfig('VITE_FARO_COLLECTOR_URL')

if (collectorUrl) {
  // Session sampling — only 50% of sessions send telemetry to reduce volume
  const sessionId = crypto.randomUUID?.() || Math.random().toString(36)
  const sessionHash = Array.from(sessionId).reduce((h, c) => (h * 31 + c.charCodeAt(0)) | 0, 0)
  const shouldSample = Math.abs(sessionHash) % 100 < 50

  if (shouldSample) {
    faro = initializeFaro({
      url: collectorUrl,
      app: {
        name: 'bike-weather-frontend',
        version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
      },
      instrumentations: [
        ...getWebInstrumentations(),
        new TracingInstrumentation({
          instrumentationOptions: {
            propagateTraceHeaderCorsUrls: [new RegExp(`${window.location.origin}/api`)],
          },
        }),
        new ReactIntegration({
          router: createReactRouterV6Options({
            createRoutesFromChildren,
            matchRoutes,
            Routes,
            useLocation,
            useNavigationType,
          }),
        }),
      ],
    })

    // Global click tracking — reports button/link clicks as Faro custom events
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement
      if (!target) return

      const clickable = target.closest('a, button, [role="button"]') as HTMLElement | null
      if (!clickable) return

      const text = (clickable.textContent || '').trim().slice(0, 100)
      const tag = clickable.tagName.toLowerCase()
      const href = clickable.getAttribute('href') || undefined

      faro!.api.pushEvent('click', {
        tag,
        text,
        path: window.location.pathname,
        ...(href ? { href } : {}),
      })
    })
  }
}
