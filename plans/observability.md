# Plan: Add Grafana Faro + Alloy for Frontend & Backend Observability

## Problem

No frontend observability exists — click rates, JS errors, and user experience issues are invisible. The backend also lacks distributed tracing, making it impossible to trace a user action from browser to database.

## Approach

Add **Grafana Faro** (browser SDK) → **Grafana Alloy** (collector) → **Loki** (logs), **Tempo** (traces), **Prometheus** (metrics). Instrument the backend with **OpenTelemetry** so frontend traces propagate through the API.

### Architecture

```
Browser (Faro SDK)
  ↓ POST /collect (via bike-weather.com nginx)
Alloy (monitoring namespace)
  ├─→ Loki (logs, errors, click events)
  ├─→ Tempo (traces — browser + backend spans)
  └─→ Prometheus (Web Vitals, custom metrics)

FastAPI Backend (OTel SDK)
  ↓ OTLP gRPC
Alloy → Tempo (correlated backend spans)
```

## Todos

### 1. `homelab-loki` — Deploy Loki in monitoring namespace
- Add Loki Helm chart source to monitoring ArgoCD app (or create separate ArgoCD app)
- Use `loki` Helm chart from `grafana/helm-charts`
- Monolithic mode (single binary) — sufficient for homelab scale
- Local-path storage for data persistence
- Add Grafana datasource for Loki

### 2. `homelab-tempo` — Deploy Tempo in monitoring namespace
- Add Tempo Helm chart source to monitoring ArgoCD app (or create separate ArgoCD app)
- Use `tempo` Helm chart from `grafana/helm-charts`
- Monolithic mode
- Local-path storage
- Accept OTLP gRPC on port 4317
- Add Grafana datasource for Tempo

### 3. `homelab-alloy` — Deploy Grafana Alloy in monitoring namespace
- Add Alloy Helm chart source (or plain manifests) to monitoring namespace
- Configure Alloy pipeline:
  - `faro.receiver` → receive browser telemetry on HTTP port 12347
  - Forward logs → Loki
  - Forward traces → Tempo (OTLP)
  - Forward metrics → Prometheus (remote_write)
- Create a Service for Alloy in monitoring namespace
- Add Alloy's Faro receiver port as a Kubernetes Service

### 4. `homelab-alloy-route` — Expose Alloy /collect through bike-weather nginx
- Update `nginx-configmap.yaml` in homelab's `apps/bike-weather/` to add:
  ```
  location /collect {
      proxy_pass http://alloy.monitoring.svc.cluster.local:12347;
  }
  ```
- This makes `bike-weather.com/collect` route to Alloy's Faro receiver

### 5. `frontend-faro` — Add Grafana Faro SDK to frontend
- `npm install @grafana/faro-web-sdk @grafana/faro-web-tracing`
- Create `src/faro.ts` — initialize Faro with:
  - Collector URL: configured via `VITE_FARO_COLLECTOR_URL` (runtime config)
  - App name: `bike-weather-frontend`
  - App version from `__APP_VERSION__`
  - Instrumentations: errors, web vitals, console, session tracking
  - Tracing: W3C trace context propagation for `/api` requests
- Import and initialize in `main.tsx` (before React renders)
- Update `config.ts` RuntimeConfig interface with `VITE_FARO_COLLECTOR_URL`
- Update `docker-entrypoint.sh` to include `VITE_FARO_COLLECTOR_URL`
- Update `.env.example` with `VITE_FARO_COLLECTOR_URL=`

### 6. `frontend-click-tracking` — Add click event instrumentation
- Add a global click handler or React event wrapper that reports navigation/button clicks to Faro as custom events
- Track: element tag, text content, page path, timestamp
- This directly addresses the "click rates" requirement

### 7. `backend-otel` — Add OpenTelemetry to FastAPI backend
- Add dependencies: `opentelemetry-api`, `opentelemetry-sdk`, `opentelemetry-instrumentation-fastapi`, `opentelemetry-exporter-otlp`, `opentelemetry-instrumentation-httpx`, `opentelemetry-instrumentation-sqlalchemy`
- Create `app/telemetry.py` — configure OTel TracerProvider:
  - OTLP gRPC exporter → Alloy (alloy.monitoring.svc.cluster.local:4317)
  - Service name: `bike-weather-backend`
  - Instrument FastAPI, httpx, SQLAlchemy
- Initialize in `app/main.py` lifespan
- Add env vars to backend configmap: `OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_SERVICE_NAME`

### 8. `homelab-frontend-env` — Update frontend deployment with Faro config
- Add `VITE_FARO_COLLECTOR_URL: "https://bike-weather.com/collect"` to frontend deployment env vars in homelab

### 9. `homelab-backend-env` — Update backend configmap with OTel config
- Add `OTEL_EXPORTER_OTLP_ENDPOINT` and `OTEL_SERVICE_NAME` to `configmap.yaml`

### 10. `homelab-grafana-datasources` — Configure Grafana datasources for Loki & Tempo
- Add Loki and Tempo as additional datasources in the kube-prometheus-stack Helm values
- This way they appear automatically in Grafana

## Notes

- Loki, Tempo, and Alloy will be deployed as separate ArgoCD applications for clean separation
- All three use monolithic mode (single-binary) — appropriate for homelab scale
- Faro's trace context propagation (`traceparent` header) ties frontend and backend spans together automatically
- Click tracking uses Faro's custom events API — no heavy analytics framework needed
- The `/collect` endpoint on nginx needs CORS headers for the browser to POST telemetry
