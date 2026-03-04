import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'
import { getConfig } from './config'

const collectorUrl = getConfig('VITE_FARO_COLLECTOR_URL')

if (collectorUrl) {
  const faro = initializeFaro({
    url: collectorUrl,
    app: {
      name: 'bike-weather-frontend',
      version: typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0',
    },
    instrumentations: [
      ...getWebInstrumentations({
        captureConsole: true,
      }),
      new TracingInstrumentation({
        instrumentationOptions: {
          propagateTraceHeaderCorsUrls: [new RegExp(`${window.location.origin}/api`)],
        },
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

    faro.api.pushEvent('click', {
      tag,
      text,
      path: window.location.pathname,
      ...(href ? { href } : {}),
    })
  })
}
