import {
  initializeFaro,
  ErrorsInstrumentation,
  SessionInstrumentation,
  ViewInstrumentation,
  type Faro,
} from '@grafana/faro-web-sdk'
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
      // Only errors, sessions and page views — no tracing, console capture,
      // web-vitals or click events to keep /collect traffic minimal.
      instrumentations: [
        new ErrorsInstrumentation(),
        new SessionInstrumentation(),
        new ViewInstrumentation(),
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
  }
}
