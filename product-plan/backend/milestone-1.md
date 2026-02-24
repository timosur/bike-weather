# Milestone 1: Backend Scaffold + Docker Compose

## What

Bare FastAPI project that boots in Docker with PostgreSQL. No API routes yet — just health check, DB connection, models, migrations, and seed data.

## Backend files

- `backend/pyproject.toml` — Dependencies: fastapi, uvicorn, sqlmodel, asyncpg, alembic, PyJWT[crypto], httpx. Dev dependencies: pytest, pytest-asyncio, httpx (test client), factory-boy, coverage.
- `backend/Dockerfile` — Python 3.12 slim, pip install, workdir /app
- `backend/app/__init__.py`
- `backend/app/main.py` — FastAPI app, CORS middleware, lifespan (run seed on startup), /health endpoint
- `backend/app/config.py` — Pydantic Settings (DATABASE_URL, AUTHENTIK_ISSUER_URL, AUTHENTIK_AUDIENCE, CORS_ORIGINS)
- `backend/app/database.py` — create_async_engine, async sessionmaker, get_session dependency
- `backend/app/models/` — SQLModel table models:
  - `User` — id, external_id (from Authentik sub), email, name, is_admin, created_at
  - `SavedRoute` — id (UUID), user_id (FK), name, origin, destination, distance, riding_style, last_condition, last_used, created_at
  - `Product` — id, category_id (FK), name, description, price, image_url, affiliate_url, shop_id (FK), is_published, created_at, updated_at
  - `Shop` — id, name, logo_url, base_url
  - `ProductCategory` — id, name, slug, description, icon, display_order
  - `AffiliateDisclosure` — id, text, is_active
  - `ContactMessage` — id, category, name, email, message, created_at
  - `FaqItem` — id, question, answer, category, display_order, is_published, created_at, updated_at
  - `AboutContent` — id, section_key (unique slug, e.g. "intro", "bio", "mission"), title, body (markdown), image_url, display_order, is_published, updated_at
- `backend/app/seed.py` — Populates products, shops, categories, disclosure, FAQ items, and about content from existing sample data
- `backend/alembic.ini` + `backend/alembic/env.py` + initial migration creating all tables
- `docker-compose.yml` (repo root) — PostgreSQL + backend + frontend services
- `frontend/Dockerfile` — Node 20 alpine for frontend dev server

## Implementation guidelines

- Set up `backend/tests/conftest.py` from the start with:
  - An async test DB session fixture that creates tables, wraps each test in a transaction, and rolls back after.
  - An `async_client` fixture using httpx `AsyncClient` with the FastAPI app + dependency override for the DB session.
  - A `seed_db` fixture that runs the seed function for tests that need reference data.
- Models should use proper SQLModel field definitions with types, nullable flags, defaults, and foreign key relationships.
- Seed data should be idempotent — safe to run multiple times without duplicating rows (upsert or check-before-insert).
- Docker Compose should include a healthcheck for PostgreSQL so the backend waits for it.
- Content models (`FaqItem`, `AboutContent`) use `is_published` flag so draft content can exist without appearing on the frontend.
- `AboutContent` uses `section_key` as a stable identifier (e.g. "intro", "bio") so the frontend can request specific sections by key.

## Tests

- `tests/test_health.py`:
  - `test_health_returns_200` — GET /health returns 200 with expected body.
- `tests/test_database.py`:
  - `test_db_session_connects` — Verify async session can execute a simple query.
  - `test_tables_created` — Verify all expected tables exist after migration.
- `tests/test_seed.py`:
  - `test_seed_populates_products` — After seeding, Product table has expected row count.
  - `test_seed_populates_categories` — After seeding, ProductCategory table has expected row count.
  - `test_seed_populates_faq` — After seeding, FaqItem table has expected row count.
  - `test_seed_populates_about_content` — After seeding, AboutContent table has expected sections.
  - `test_seed_is_idempotent` — Running seed twice produces the same row count (no duplicates).

## Verify

- `docker compose up` → all 3 services start
- `curl localhost:8000/health` → 200 OK
- `localhost:8000/docs` → OpenAPI UI (empty routes section)
- DB has seeded product/shop/category/FAQ/about data
- `pytest` passes all tests
