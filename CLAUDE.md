# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Bike Weather is a React/TypeScript web app that gives cyclists personalized clothing and gear recommendations based on weather data. Currently frontend-only with mock data; a Python FastAPI backend is planned but not yet implemented.

## Local Development

### Prerequisites

- Docker (for PostgreSQL)
- Node.js 20+
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

### Daily Workflow

```bash
make setup   # first time: creates .env, installs Python + Node deps
make dev     # starts PostgreSQL, runs migrations, launches backend + frontend
```

Backend runs at `http://localhost:8000`, frontend at `http://localhost:5173`. Both hot-reload on file changes. Press Ctrl+C to stop the app processes; PostgreSQL keeps running. Use `make dev-stop` to stop PostgreSQL.

Run `make help` to see all available targets.

## Commands

All frontend commands run from `frontend/`:

```bash
cd frontend
npm install       # install dependencies
npm run dev       # start Vite dev server with HMR (http://localhost:5173)
npm run build     # TypeScript check (tsc -b) + Vite production build
npm run preview   # preview production build locally
```

No test framework is configured yet. No linter is configured.

## Commit Conventions

All commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<optional scope>): <description>
```

Common types: `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `test`, `perf`, `ci`, `build`.

## Architecture

### Frontend (`frontend/`)

- **React 19** + **TypeScript 5.7** + **Vite 6** + **Tailwind CSS 3.4**
- **Routing:** React Router DOM v7 — all pages lazy-loaded in `App.tsx`
- **Path alias:** `@/*` resolves to `src/*` (configured in both `vite.config.ts` and `tsconfig.json`)
- **Strict TypeScript:** `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch` enabled

**Key directories under `frontend/src/`:**

- `pages/` — Page components (default exports, one per route)
- `components/` — Feature components organized by domain: `shell/`, `ride-planner/`, `ride-report/`, `product-recommendations/`, `my-routes/`, `auth/`, `contact/`, `faq/`, `about-me/`, `imprint/`, `privacy-policy/`
- `hooks/` — Custom hooks (e.g., `useLocationSearch` for Nominatim geocoding)
- `data/` — Hardcoded sample data (`sample-products.ts`, `sample-routes.ts`, `sample-faq.ts`)

**Component patterns:**

- Pages manage state and pass data/callbacks to feature components
- Feature components are presentational with callback props
- Each feature domain has its own `types.ts` for data shapes
- Auth is mock-only via localStorage (`bike-weather:user` key), with a `RequireAuth` wrapper for protected routes

**Styling:**

- Tailwind with class-based dark mode
- Design tokens: emerald (primary), amber (secondary), stone (neutral)
- Fonts: Outfit (headings), Inter (body), IBM Plex Mono (mono)

### Planned Backend (`product-plan/backend/`)

Detailed 10-milestone implementation plan in `product-plan/backend/`. Key decisions:

- Python FastAPI + SQLModel + asyncpg + Alembic
- Authentik (self-hosted OIDC) for auth with Google OAuth
- Docker Compose for PostgreSQL + Backend + Frontend
- All routes under `/api` prefix
- Rule-based recommendation engine using Open-Meteo weather data

### Product Plan (`product-plan/`)

Contains implementation guides, design system specs, data shape contracts, and step-by-step milestone instructions for both frontend (11 milestones, completed) and backend (10 milestones, not started). Consult these when implementing backend features.
