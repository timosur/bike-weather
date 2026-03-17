import {
  initializeFaro,
  ErrorsInstrumentation,
  SessionInstrumentation,
  ViewInstrumentation,
  WebVitalsInstrumentation,
} from '@grafana/faro-web-sdk'
import { ReactIntegration, createReactRouterV6Options } from '@grafana/faro-react'
import { createRoutesFromChildren, matchRoutes, Routes, useLocation, useNavigationType } from 'react-router-dom'
import { getConfig } from './config'

const collectorUrl = getConfig('VITE_FARO_COLLECTOR_URL')

export let faro = initializeFaro({
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
    new WebVitalsInstrumentation(),
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
