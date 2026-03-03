# Architecture

> Last updated by spec-docs skill. Reflects codebase as of the latest run.

## System Overview

Bike Weather is a web application that gives cyclists personalized clothing and gear recommendations based on real weather data for their planned rides. It consists of three independent services in a monorepo, backed by PostgreSQL and Authentik for identity.

## Services

### Frontend (`frontend/`)

- **Type:** React 19 Single-Page Application
- **Bundler:** Vite 6
- **Styling:** Tailwind CSS with class-based dark mode
- **Fonts:** Outfit (headings), Inter (body), IBM Plex Mono (mono)
- **i18n:** i18next — German (default) and English
- **Auth:** Custom `AuthContext` wrapping Authentik OIDC tokens stored in localStorage
- **Routing:** React Router v7 with lazy-loaded pages
- **Dev server:** `http://localhost:5173`, proxied to backend

### Backend (`backend/`)

- **Type:** FastAPI REST API (Python 3.12+)
- **ORM:** SQLModel (SQLAlchemy + Pydantic)
- **Database driver:** asyncpg (async PostgreSQL)
- **Migrations:** Alembic
- **Package manager:** uv
- **Auth:** JWT validation via Authentik OIDC JWKS
- **Rate limiting:** slowapi
- **Middleware:** CORS, LocaleMiddleware (Accept-Language → request.state.locale)
- **Seed data:** Loaded on startup via `app/seed.py`
- **Dev server:** `http://localhost:8000`

### Agent (`agent/`)

- **Type:** LLM-powered product scraper CLI
- **LLMs:** OpenAI + Anthropic
- **Package manager:** uv
- **Purpose:** Scrapes cycling product data from configured shops and publishes to the backend database

## Infrastructure (Docker Compose)

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `bikeweather-db-dev` | `postgres:16-alpine` | 5432 | Application database |
| `bikeweather-authentik-db` | `postgres:16-alpine` | — | Authentik's own database |
| `bikeweather-authentik-redis` | `redis:7-alpine` | — | Authentik session/cache store |
| `bikeweather-authentik-server` | `ghcr.io/goauthentik/server:2025.12.3` | 9000 | Authentik OIDC server |
| `bikeweather-authentik-worker` | `ghcr.io/goauthentik/server:2025.12.3` | — | Authentik background worker |

Volumes: `pgdata_dev`, `authentik_pgdata`, `authentik_redis`, `authentik_media`.

## Service Communication

```
┌─────────────┐     HTTP/JSON     ┌─────────────┐     asyncpg     ┌────────────┐
│   Frontend   │ ───────────────▶ │   Backend   │ ──────────────▶ │ PostgreSQL │
│  (Vite SPA)  │   /api/*         │  (FastAPI)  │                 │   (5432)   │
└─────────────┘                   └─────────────┘                 └────────────┘
                                        │
                                        │ JWKS validation
                                        ▼
                                  ┌─────────────┐
                                  │  Authentik   │
                                  │   (9000)     │
                                  └─────────────┘

┌─────────────┐     Direct DB write
│   Agent      │ ──────────────────────────────────────────────▶ │ PostgreSQL │
│  (CLI/LLM)   │                                                 │   (5432)   │
└─────────────┘
```

- **Frontend → Backend:** All API calls go through `/api/*` prefix. The Vite dev server proxies these to `localhost:8000`.
- **Backend → PostgreSQL:** Async connections via asyncpg + SQLAlchemy async engine.
- **Backend → Authentik:** JWKS endpoint fetched to validate JWT access tokens. Headless auth API used for login/register/password flows.
- **Agent → PostgreSQL:** Directly writes scraped product data to the database.

## Build & Run

```bash
make setup          # .env, Python + Node deps, Authentik provisioning
make dev            # PostgreSQL + Authentik → migrations → backend (8000) + frontend (5173)
make dev-stop       # Stop containers
make test-backend   # pytest
make test-agent     # pytest
make test-frontend  # Playwright E2E
```

## Key Backend Patterns

- **Route → Service → Model:** Route handlers in `app/api/routes/` call services in `app/services/`, which operate on models in `app/models/`.
- **Rule engine:** `app/rules/` contains deterministic rule modules for clothing, equipment, safety, repair kits, and tips — all driven by weather conditions.
- **Translation service:** `app/services/translation.py` fetches per-field translations from the `content_translations` table. German is the base language stored on models; English translations are in the translations table.
