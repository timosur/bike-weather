# Backend Implementation Plan — Fahrrad Wetter

## Context

The frontend is fully built (11 milestones) with hardcoded sample data, localStorage persistence, and mock auth. This plan implements a Python FastAPI backend that replaces all of that with live weather data, a rule-based recommendation engine, real JWT auth with Google OAuth, and PostgreSQL persistence. All 3 services (DB, backend, frontend) run in Docker Compose.

## Design Decisions (from review)

- SavedRoute type: Keep frontend structure as-is (ridingStyle field). Backend mirrors it.
- Contact endpoint: Add POST /api/contact (not in original plan).
- FAQ + About Me: Managed in DB, served via public API, editable via admin API.
- Authentication: Authentik as self-hosted identity provider (OIDC). Backend validates JWTs, no custom auth logic. Google OAuth configured as Authentik social login source.
- last*condition: Report endpoint accepts optional route_id to update saved route.

## General Guidelines

### Project Structure

```
backend/
  app/
    api/
      routes/        # Route handlers (thin — validate, call service, return response)
      dependencies.py
    models/          # SQLModel table definitions
    schemas/         # Pydantic request/response schemas (separate from DB models)
    services/        # Business logic (testable without HTTP)
    rules/           # Rule engine modules
    config.py
    database.py
    main.py
    seed.py
  tests/
    conftest.py      # Shared fixtures (async client, test DB session, factories)
    test_api/        # API/integration tests (one file per route module)
    test_services/   # Unit tests for service layer
    test_rules/      # Unit tests for rule engine
  alembic/
  pyproject.toml
  Dockerfile
```

### Testing

- **Framework**: pytest + pytest-asyncio + httpx (AsyncClient for API tests)
- **Database**: Use a separate test database (or SQLite in-memory for speed). Each test function gets a rolled-back transaction via fixture so tests are isolated.
- **Coverage target**: Aim for meaningful coverage — every endpoint, every service function, every rule branch. Don't test framework boilerplate.
- **Test naming**: `test_<action>_<scenario>` — e.g. `test_login_invalid_password_returns_401`.
- **Fixtures over mocks**: Prefer real DB fixtures and factory functions. Mock only external HTTP calls (Open-Meteo, Nominatim, Google OAuth).
- **Each milestone must pass all tests from previous milestones** (no regressions).

### API Design

- All routes under `/api` prefix.
- Return consistent error shape: `{ "detail": "message" }` (FastAPI default for HTTPException).
- Use appropriate HTTP status codes: 200 (success), 201 (created), 400 (bad input), 401 (unauthenticated), 403 (forbidden), 404 (not found), 422 (validation error).
- Pydantic schemas for all request bodies and responses — never return raw ORM objects.
- Use FastAPI dependency injection for DB sessions, current user, etc.

### Database

- Alembic for all schema changes — never modify tables by hand.
- SQLModel for models (shared Pydantic + SQLAlchemy).
- Use async sessions (asyncpg) throughout.
- Foreign keys and constraints at the DB level, not just application level.
- Indexes on columns used in WHERE/ORDER BY (e.g. `user_id`, `last_used`).

### Error Handling

- Let FastAPI's built-in validation (Pydantic 422) handle malformed requests.
- Raise `HTTPException` in route handlers for business-level errors.
- Services should raise domain exceptions (e.g. `UserNotFoundError`); route handlers catch and convert to HTTP responses.
- Log unexpected errors with stack traces; return generic 500 to client.

### Security

- Authentication delegated to Authentik (OIDC). Backend only validates JWTs via JWKS — no password storage, no token issuance.
- JWT validation: verify signature (JWKS), issuer, audience, and expiry on every authenticated request.
- JIT user provisioning: create backend User record on first authenticated request from token claims.
- Validate ownership on all resource mutations (routes, etc.).
- CORS configured to allow only the frontend origin.

### Configuration

- All secrets and environment-specific values via environment variables.
- Pydantic Settings with `.env` file support for local dev.
- Never commit secrets — `.env` in `.gitignore`.

## Milestones

1. [Backend Scaffold + Docker Compose](milestone-1.md)
2. [Public Content APIs + Frontend Wiring](milestone-2.md) — Products, FAQ, About Me
3. [Geocoding Proxy](milestone-3.md)
4. [Weather + Recommendation Engine](milestone-4.md)
5. [Authentication via Authentik](milestone-5.md)
6. [Content Admin API](milestone-6.md) — Admin CRUD for Products, FAQ, About Me
7. [Saved Routes API](milestone-7.md)
8. [Contact Form Endpoint](milestone-8.md)
9. [LLM Product Agent](milestone-9.md) — Automated product scraping + import
10. [Cleanup + Polish](milestone-10.md)
