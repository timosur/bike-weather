---
applyTo: "backend/**"
---

# Backend Instructions

## Structure

All API routes mount under `/api` via `app.api.api_router`. Follow the route → service → model pattern:

- `app/api/routes/` — FastAPI route handlers (thin: validate input, call service, return response)
- `app/services/` — business logic (weather, recommendations, auth, geocoding, etc.)
- `app/models/` — SQLModel ORM models (also serve as Pydantic schemas)
- `app/schemas/` — request/response schemas when they differ from models
- `app/rules/` — rule-based recommendation engine (clothing, equipment, safety, tips by weather conditions)

## Auth

Auth is Authentik (self-hosted OIDC). JWT validation in `app/api/dependencies.py`.

- Use `Depends(get_current_user)` for authenticated routes
- Use `Depends(get_admin_user)` for admin-only routes
- Never implement custom auth logic — all auth goes through Authentik

## Database

- **ORM:** SQLModel (SQLAlchemy + Pydantic hybrid)
- **Async driver:** asyncpg
- **Migrations:** Alembic in `backend/alembic/`
  - Create: `cd backend && uv run alembic revision --autogenerate -m "description"`
  - Apply: `cd backend && uv run alembic upgrade head`
- **Seed data:** Loaded on startup via `app/seed.py`

## Patterns

- **Route handlers should be thin.** Extract business logic into services. Routes validate input, call a service, and return the result.
- **Check existing routes before creating new ones:** `ls backend/app/api/routes/`
- **Check existing services before creating new ones:** `ls backend/app/services/`
- **Check existing models before creating new ones:** `ls backend/app/models/`
- **Pydantic validation** on all request bodies via SQLModel or custom schemas
- **Rate limiting** via slowapi — apply to public-facing endpoints (login, register, report generation, contact)

## Configuration

- Config loaded via `pydantic-settings` from `.env`
- Middleware: CORS, `LocaleMiddleware` (parses `Accept-Language` → `request.state.locale`)

## Testing

```bash
cd backend && uv run pytest                           # all tests
cd backend && uv run pytest tests/test_api/test_X.py  # single file
cd backend && uv run pytest -k test_name              # single test
```

- `asyncio_mode = "auto"` — test functions can be `async def` without decorators
- Tests use an isolated test database
