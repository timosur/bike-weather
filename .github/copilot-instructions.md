# Copilot Instructions

## Build & Run

```bash
make setup          # first time: .env, Python + Node deps, Authentik provisioning
make dev            # PostgreSQL + Authentik → migrations → backend (8000) + frontend (5173)
make dev-stop       # stop containers
```

### Testing

```bash
make test-backend                          # all backend tests (pytest)
cd backend && uv run pytest tests/test_api/test_rides.py  # single test file
cd backend && uv run pytest -k test_name   # single test by name

make test-agent                            # all agent tests (pytest)
cd agent && uv run pytest tests/test_file.py  # single agent test file

make test-frontend                         # Playwright E2E (all)
cd frontend && npx playwright test e2e/auth.spec.ts  # single E2E spec
```

### Build

```bash
cd frontend && npm run build    # tsc -b + vite build
```

No linter is configured for either frontend or backend.

## Architecture

Three independent services in one repo, each with its own dependency management:

- **`frontend/`** — React 19 SPA. `npm` + `package.json`. Vite dev server proxied to backend.
- **`backend/`** — FastAPI REST API. `uv` + `pyproject.toml`. Alembic for DB migrations.
- **`agent/`** — LLM-powered product scraper (OpenAI + Anthropic). `uv` + `pyproject.toml`. Standalone CLI.

### Backend structure

All API routes mount under `/api` via `app.api.api_router`. Route → service → model pattern:
- `app/api/routes/` — FastAPI route handlers
- `app/services/` — business logic (weather, recommendations, auth, geocoding)
- `app/models/` — SQLModel ORM models (also serve as Pydantic schemas)
- `app/schemas/` — request/response schemas when they differ from models
- `app/rules/` — rule-based recommendation engine (clothing, equipment, safety, tips by weather conditions)

Auth is Authentik (self-hosted OIDC). JWT validation in `app/api/dependencies.py`. Backend seeds default data on startup via `app/seed.py`.

### Frontend structure

All pages lazy-loaded in `App.tsx` with React Router v7. Import alias `@/*` → `src/*`.

- `src/pages/` — page components (default exports, one per route)
- `src/components/` — organized by feature domain (`shell/`, `ride-planner/`, `admin/`, etc.)
- `src/api/` — API client modules, one per backend resource. All use `apiFetch()` from `client.ts`.
- `src/contexts/AuthContext.tsx` — OIDC auth state via `oidc-client-ts`
- `src/i18n/` — i18next with German (default) and English. Keys in `locales/de.json` and `locales/en.json`.

### Infrastructure

Docker Compose runs PostgreSQL 16 + Authentik (OIDC server + worker + Redis + its own Postgres). Backend reads `.env` for config via `pydantic-settings`.

## Conventions

- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/) — `feat(scope):`, `fix(scope):`, etc.
- **TypeScript:** Strict mode with `noUnusedLocals`, `noUnusedParameters`, `noFallthroughCasesInSwitch`.
- **Python tests:** `asyncio_mode = "auto"` in pytest config — test functions can be `async def` without decorators.
- **Frontend API pattern:** Each backend resource has a matching `src/api/<resource>.ts` module that wraps `apiFetch()`.
- **i18n:** All user-facing strings go through `useTranslation()`. German is the fallback language. Backend sends `Accept-Language` header via the API client.
- **Styling:** Tailwind with class-based dark mode. Fonts: Outfit (headings), Inter (body), IBM Plex Mono (mono).
- **Route guards:** `RequireAuth` and `RequireAdmin` wrappers in `App.tsx` protect routes.
- **Backend migrations:** Alembic in `backend/alembic/`. Run `cd backend && uv run alembic revision --autogenerate -m "description"` to create new migrations.

## Agent Behavior

### Workflow

For non-trivial changes, follow this sequence:
1. **Research** — read relevant files, search for existing patterns and reusable utilities before writing code.
2. **Plan** — decompose into small, self-contained tasks with clear acceptance criteria.
3. **Implement** — execute each task with surgical precision. Make minimal changes.
4. **Verify** — confirm the change works (build, tests, manual check) before moving on.

### Principles

- **Minimum necessary complexity.** Apply YAGNI/KISS — don't add unrequested features or speculative abstractions. Balance leanness with genuine robustness.
- **Verify before acting.** Never assume — read the actual code, check actual file paths, confirm actual API signatures. Base decisions on verified facts, not guesses.
- **Clean up as you go.** When changes make code obsolete, remove it immediately. No dead code, no orphaned imports.
- **Propagate change impact.** When modifying a function signature, type, or API contract, trace and update all upstream and downstream callers.
- **Reuse what exists.** Search for existing utilities, components, hooks, and helpers before creating new ones. Follow established patterns in the codebase.
- **Don't hammer.** If an approach fails twice, change strategy instead of retrying the same thing.
- **Constructive fixes only.** Address root causes — don't disable tests, suppress errors, or remove functionality to make something pass.
- **Keep the spec in sync.** After making non-trivial code changes (new endpoints, models, features, or architectural changes), invoke the `spec-docs` skill to update the specification documents in `docs/spec/`.

## Parallel Sessions

Multiple Copilot CLI instances can run simultaneously in separate terminals to work on different parts of the project. Guidelines:

### Recommended Session Splits

- **Frontend session** — UI components, pages, i18n, styles. Working directory: `frontend/`.
- **Backend session** — API routes, services, models, migrations. Working directory: `backend/`.
- **Agent session** — Product scraper logic. Working directory: `agent/`.
- **Cross-cutting session** — Docker, CI/CD, docs, root-level config.

### Avoiding Conflicts

- Each session should focus on one service boundary. Avoid editing the same files from multiple sessions.
- Coordinate database migrations — only one session should create Alembic revisions at a time.
- If sessions touch shared files (e.g., `docker-compose.yml`, `.env.example`), finish one edit before starting another.
- Run `git pull --rebase` before committing to pick up changes from other sessions.

### Tips

- Use `/rename` to label each session (e.g., "frontend-auth", "backend-api").
- Use `/diff` in each session to review changes before committing.
- Keep sessions focused — one feature or fix per session works best.
- If a change in one service requires a matching change in another (e.g., new API endpoint + frontend integration), plan the interface first, then implement in parallel.
