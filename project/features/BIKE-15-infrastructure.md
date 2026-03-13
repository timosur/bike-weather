# BIKE-15: Infrastructure

| Field            | Value      |
| ---------------- | ---------- |
| **ID**           | BIKE-15    |
| **Status**       | Deployed   |
| **Created**      | 2024-01-01 |
| **Dependencies** | None       |

## Description

Cross-cutting infrastructure concerns: rate limiting, database migrations, seed data, development environment, and configuration management.

## Scope

Sub-features and areas covered:

- Rate limiting via slowapi — per-endpoint rate limits (e.g., login 10/min, register 5/min, contact 5/min, report 20/min)
- Alembic database migrations (PostgreSQL 16)
- Seed data loading on startup (default categories, shops, FAQ, about content)
- Docker Compose development environment (PostgreSQL + Authentik + Redis)
- pydantic-settings configuration management (.env-based)
- Health check endpoint (GET /health)
- Makefile with dev commands (setup, dev, dev-stop, test-backend, test-frontend, test-agent)

### Key Files

- `backend/app/` — slowapi rate limiter setup
- `backend/alembic/` — Alembic migration scripts
- `backend/alembic.ini` — Alembic configuration
- `backend/app/seed.py` or `backend/run_seed.py` — seed data loader
- `backend/entrypoint.sh` — backend startup script (migrations + seed + serve)
- `docker-compose.yml` — development environment (PostgreSQL, Authentik, Redis)
- `Makefile` — dev workflow commands
- `Procfile.dev` — process manager for local development

## Acceptance Criteria (Summary)

- Rate limits enforce per-endpoint request thresholds
- Alembic migrations run automatically on backend startup
- Seed data populates default content on first run
- `make dev` starts all services (database, auth, backend, frontend)
- Configuration is managed via `.env` and pydantic-settings
- Health check endpoint returns 200 when the service is healthy

---

## Tech Design

_Retroactive — see `project/spec/architecture.md` and `project/spec/api.md`._

## QA Results

_No formal QA tracking for retroactive features._

## Deployment

_Deployed to production via ArgoCD. See release skill for version history._
