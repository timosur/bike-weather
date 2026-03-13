# BIKE-13: Observability

| Field            | Value      |
| ---------------- | ---------- |
| **ID**           | BIKE-13    |
| **Status**       | Deployed   |
| **Created**      | 2024-01-01 |
| **Dependencies** | None       |

## Description

Full-stack observability with Grafana Faro (frontend) and OpenTelemetry (backend). Includes error tracking, Web Vitals monitoring, click tracking, and distributed tracing with W3C trace context propagation linking frontend browser spans through backend API calls to database queries.

## Scope

Sub-features and areas covered:

- Grafana Faro integration — automatic capture of JS errors and unhandled promise rejections
- Web Vitals monitoring — Core Web Vitals (LCP, FID, CLS) reported to Grafana
- Click tracking — global event listener reports button/link clicks as Faro custom events (element tag, text, page path, href)
- Distributed tracing — W3C trace context propagation from browser to backend to database
- Backend OpenTelemetry — auto-instrumentation for FastAPI routes, httpx calls, and SQLAlchemy queries

### Key Files

- `frontend/src/` — Faro SDK initialization and Web Vitals reporting (in app entry/shell)
- `backend/app/` — OpenTelemetry setup and auto-instrumentation configuration

## Acceptance Criteria (Summary)

- Frontend JS errors are automatically captured and sent to Grafana Faro
- Core Web Vitals (LCP, FID, CLS) are reported to the monitoring backend
- Button and link clicks are tracked as custom events with context metadata
- Trace context is propagated across frontend → backend → database
- Backend FastAPI routes, httpx calls, and SQLAlchemy queries are auto-instrumented

---

## Tech Design

_Retroactive — see `project/ARCHITECTURE.md`._

## QA Results

_No formal QA tracking for retroactive features._

## Deployment

_Deployed to production via ArgoCD. See release skill for version history._
