# Architecture

> Living reference document. Keep in sync when APIs, models, or auth flows change.

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

- **Type:** LLM-powered product extraction microservice
- **Framework:** FastAPI
- **LLMs:** OpenAI + Anthropic
- **Package manager:** uv
- **Purpose:** Stateless extraction service — receives scrape requests via HTTP, fetches pages, runs LLM extraction, and returns structured product data. No database access or publishing.

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

┌─────────────┐     HTTP proxy    ┌─────────────┐
│   Backend   │ ───────────────▶ │    Agent    │
│  (FastAPI)  │  /api/admin/     │  (FastAPI)  │
└─────────────┘  agent/*         └─────────────┘
```

- **Frontend → Backend:** All API calls go through `/api/*` prefix. The Vite dev server proxies these to `localhost:8000`.
- **Backend → PostgreSQL:** Async connections via asyncpg + SQLAlchemy async engine.
- **Backend → Authentik:** JWKS endpoint fetched to validate JWT access tokens. Headless auth API used for login/register/password flows.
- **Backend → Agent:** HTTP proxy for extraction jobs. Backend forwards admin panel requests to agent's FastAPI endpoints (`/jobs`, `/shops`, `/categories`). On approval, backend bulk-imports the extracted products directly.
- **Agent → External:** Fetches product pages via httpx/Playwright, sends text to LLM APIs (OpenAI/Anthropic) for extraction. No database access.

## Key Backend Patterns

- **Route → Service → Model:** Route handlers in `app/api/routes/` call services in `app/services/`, which operate on models in `app/models/`.
- **Rule engine:** `app/rules/` contains deterministic rule modules for clothing, equipment, safety, repair kits, and tips — all driven by weather conditions.
- **Translation service:** `app/services/translation.py` fetches per-field translations from the `content_translations` table. German is the base language stored on models; English translations are in the translations table.

## Observability

### Frontend (Grafana Faro)

The frontend includes the Grafana Faro Web SDK (`@grafana/faro-web-sdk` + `@grafana/faro-web-tracing`), initialized in `src/faro.ts` before React renders. When `VITE_FARO_COLLECTOR_URL` is set, Faro captures errors, Web Vitals, console logs, traces (W3C trace context on `/api` requests), click events, and sessions. Disabled in local dev when the URL is empty.

### Backend (OpenTelemetry)

The backend uses OpenTelemetry SDK configured in `app/telemetry.py`. When `OTEL_EXPORTER_OTLP_ENDPOINT` is set, it configures TracerProvider with OTLP gRPC exporter, FastAPI/httpx/SQLAlchemy instrumentation. Service name defaults to `bike-weather-backend`. Disabled in local dev when the endpoint is not configured.

### Telemetry Pipeline (Production)

```
Browser (Faro SDK) → Grafana Alloy → Loki (logs) / Tempo (traces) / Prometheus (metrics)
FastAPI (OTel SDK) → Alloy → Tempo (correlated backend spans)
```

---

## API Endpoints

All endpoints are mounted under the `/api` prefix. Auth column: 🔓 public, 🔒 authenticated, 🛡️ admin.

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | 🔓 | Health check (not under `/api`) |

### Auth (`/api/auth`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/auth/me` | 🔒 | — | Get current user profile |
| POST | `/api/auth/login` | 🔓 | 10/min | Authenticate, returns OIDC tokens |
| POST | `/api/auth/register` | 🔓 | 5/min | Create account, returns OIDC tokens |
| POST | `/api/auth/change-password` | 🔒 | 5/min | Change password |
| POST | `/api/auth/forgot-password` | 🔓 | 3/min | Initiate password recovery (always 200) |
| POST | `/api/auth/reset-password` | 🔓 | 5/min | Complete password reset with token |

### Rides (`/api/rides`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/rides/report` | 🔓 | 20/min | Generate ride weather report with recommendations |
| POST | `/api/rides/import/gpx` | 🔓 | 60/min | Import route from GPX file (max 10 MB) |

### Routes (`/api/routes`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/routes` | 🔒 | List saved routes for current user |
| GET | `/api/routes/{route_id}` | 🔒 | Get a specific saved route |
| POST | `/api/routes` | 🔒 | Create a new saved route |
| PUT | `/api/routes/{route_id}` | 🔒 | Update a saved route |
| DELETE | `/api/routes/{route_id}` | 🔒 | Delete a saved route |
| POST | `/api/routes/{route_id}/share` | 🔒 | Generate share token/URL |
| DELETE | `/api/routes/{route_id}/share` | 🔒 | Revoke sharing |

### Shared (`/api/shared`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/shared/{token}` | 🔓 | 10/min | View shared ride report (current weather) |

### Products (`/api/products`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products` | 🔓 | List product categories with counts |
| GET | `/api/products/{category_id}` | 🔓 | Category detail with products and shops |

### Content (`/api/faq`, `/api/about`, `/api/app-info`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/faq` | 🔓 | List published FAQ items |
| GET | `/api/about` | 🔓 | List published about sections |
| GET | `/api/about/{section_key}` | 🔓 | Get specific about section |
| GET | `/api/app-info` | 🔓 | List published app info sections |
| GET | `/api/app-info/{section_key}` | 🔓 | Get specific app info section |

### Contact (`/api/contact`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/contact` | 🔓 | 5/min | Submit contact form (Turnstile captcha required) |

### Geocoding (`/api/geocoding`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/geocoding/search` | 🔓 | Search locations by query |
| GET | `/api/geocoding/reverse` | 🔓 | Reverse geocode lat/lon |

### Admin (`/api/admin`) 🛡️

All admin endpoints require `require_admin` dependency.

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/api/admin/products` | List (paginated, filterable) / Create |
| GET/PUT/DELETE | `/api/admin/products/{id}` | Get / Update / Delete |
| POST | `/api/admin/products/bulk` | Bulk import (optional `replaceCategory`) |
| GET/POST | `/api/admin/categories` | List / Create |
| PUT | `/api/admin/categories/{id}` | Update |
| GET/POST | `/api/admin/shops` | List / Create |
| PUT | `/api/admin/shops/{id}` | Update |
| GET/POST | `/api/admin/faq` | List / Create |
| PUT/DELETE | `/api/admin/faq/{id}` | Update / Delete |
| PUT | `/api/admin/faq/reorder` | Reorder items |
| GET/POST | `/api/admin/about` | List / Create |
| PUT/DELETE | `/api/admin/about/{id}` | Update / Delete |
| GET/POST | `/api/admin/app-info` | List / Create |
| PUT/DELETE | `/api/admin/app-info/{id}` | Update / Delete |
| GET | `/api/admin/contacts` | List (paginated, filterable) |
| GET | `/api/admin/contacts/{id}` | Get single message |

#### Agent Import Proxy (`/api/admin/agent/`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/agent/shops` | List agent shop configs |
| GET | `/api/admin/agent/categories` | List agent category configs |
| POST | `/api/admin/agent/jobs` | Start category-based extraction job |
| POST | `/api/admin/agent/jobs/urls` | Start URL-list extraction job |
| POST | `/api/admin/agent/jobs/extract-url` | Start single-URL extraction job (BIKE-20) |
| GET | `/api/admin/agent/jobs` | List recent jobs |
| GET | `/api/admin/agent/jobs/{id}` | Get job status + products (enriched with shop detection for extract-url) |
| GET | `/api/admin/agent/jobs/{id}/stream` | SSE progress stream |
| POST | `/api/admin/agent/jobs/{id}/approve` | Approve bulk import |
| POST | `/api/admin/agent/jobs/{id}/approve-url` | Approve single-URL import (BIKE-20) |

---

## Data Models

All models use SQLModel (SQLAlchemy + Pydantic). Database is PostgreSQL 16.

### User (`users`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | int (PK) | Internal user ID |
| `external_id` | str (unique) | OIDC `sub` claim from Authentik |
| `email` | str (unique) | User email |
| `name` | str | Display name |
| `is_admin` | bool | Admin flag (default: false) |
| `created_at` | datetime | Account creation timestamp |

Auto-created on first OIDC login via `_find_or_create_user`.

### SavedRoute (`saved_routes`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | str (PK) | UUID |
| `user_id` | int (FK → users) | Owner |
| `name` | str | Route display name |
| `start_location` | str | Starting address |
| `total_distance` | float | Distance value |
| `distance_unit` | str | Unit (default: "km") |
| `riding_style` | str | "Sporty", "Easy", or "Touring" |
| `last_condition` | str | Last weather condition |
| `last_used` | datetime? | Last report generation time |
| `share_token` | str? (unique) | Token for public sharing |
| `ride_input` | JSONB? | Full ride input for edit/restore |
| `created_at` | datetime | Creation timestamp |

### Product (`products`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | str (PK) | Product identifier |
| `name` | str | Product name |
| `category_id` | str (FK → product_categories) | Category |
| `image_url` | str | Product image URL |
| `shop_id` | str (FK → shops) | Shop |
| `affiliate_url` | str | Affiliate link |
| `matches_zone` | str? | Clothing zone (head, upperBody, etc.) |
| `matches_item_id` | str? | Clothing item ID (e.g. `cl-rain-jacket`) for direct product matching |
| `matches_label` | str | Product-type description |
| `weather_temp_min/max` | float? | Temperature range |
| `weather_precipitation` | str | Precipitation suitability |
| `weather_wind` | str | Wind suitability |
| `weather_summary` | str | Weather suitability summary |
| `is_published` | bool | Visibility (default: true) |
| `created_at/updated_at` | datetime | Timestamps |

### ProductCategory (`product_categories`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | str (PK) | Category identifier |
| `name` | str | Display name |
| `slug` | str (unique) | URL-friendly slug |
| `description` | str | Category description |
| `icon` | str | Icon identifier |
| `display_order` | int | Sort order |

### Shop (`shops`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | str (PK) | Shop identifier |
| `name` | str | Display name |
| `logo_url` | str | Logo URL |
| `affiliate_tag` | str? | Affiliate tracking tag |
| `base_url` | str? | Shop domain (e.g. `bike-components.de`) for URL-based shop detection |

### ProductBikeType (`product_bike_types`)

| Field | Type | Description |
|-------|------|-------------|
| `product_id` | str (PK, FK → products) | Product |
| `bike_type` | str (PK) | Bike type: `rennrad` \| `gravel` \| `mtb` \| `city` |

### FaqItem (`faq_items`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | str (PK) | FAQ identifier |
| `question/answer` | str | Q&A text (German) |
| `category` | str | Grouping category |
| `display_order` | int | Sort order |
| `is_published` | bool | Visibility |
| `created_at/updated_at` | datetime | Timestamps |

### AboutContent (`about_content`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | int (PK) | Internal ID |
| `section_key` | str (unique) | Section identifier |
| `title/body` | str | Content (German) |
| `image_url` | str? | Optional image |
| `display_order` | int | Sort order |
| `is_published` | bool | Visibility |

### AppInfoContent (`app_info_content`)

Same structure as AboutContent.

### ContactMessage (`contact_messages`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | int (PK) | Internal ID |
| `category` | str | Message category |
| `name/email` | str | Sender info |
| `message` | str | Message body |
| `created_at` | datetime | Submission timestamp |

### ContentTranslation (`content_translations`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | int (PK) | Internal ID |
| `entity_type` | str | Entity type ("product", "faq_item", etc.) |
| `entity_id` | str | Entity ID |
| `locale` | str | Target locale (e.g., "en") |
| `field_name` | str | Field translated |
| `value` | str | Translated text |

German text is stored on models. This table stores non-German translations.

### AffiliateDisclosure (`affiliate_disclosures`)

| Field | Type | Description |
|-------|------|-------------|
| `id` | int (PK) | Internal ID |
| `badge_label` | str | Badge text |
| `disclaimer_text` | str | Disclaimer text |
| `is_active` | bool | Active flag |

---

## Authentication & Authorization

### Overview

Authentication is handled by **Authentik** (self-hosted OIDC provider). The backend proxies Authentik's headless API for login, registration, and password flows, returning OIDC tokens. The frontend stores tokens in localStorage and attaches them as Bearer tokens.

### Login Flow

1. Frontend calls `POST /api/auth/login` with credentials + optional Turnstile captcha
2. Backend verifies Turnstile, calls Authentik's headless login API
3. Backend creates/updates local User from id_token claims, returns tokens
4. Frontend stores tokens in localStorage (`bike-weather:auth` key)
5. Frontend extracts profile from id_token, calls `GET /api/auth/me` for authoritative `is_admin`

### Token Management

- **Frontend:** Tokens in localStorage as `{ access_token, id_token, expires_at, profile }`. No refresh — expired tokens are cleared.
- **Backend:** `auth_service.validate_token()` validates JWT via Authentik JWKS. Returns `TokenClaims` or raises `AuthenticationError`.

### Authorization Dependencies

| Dependency | Behavior |
|------------|----------|
| `get_current_user` | Validates Bearer token, finds/creates User. 401 if invalid. Dev bypass via `X-Dev-User-Email`. |
| `get_optional_user` | Same but returns `None` for anonymous. |
| `require_admin` | Wraps `get_current_user`, checks `is_admin`. 403 if not admin. |

### Route Guards (Frontend)

| Guard | Behavior |
|-------|----------|
| `RequireAuth` | Redirects to `/login` if unauthenticated |
| `RequireAdmin` | Redirects to `/login` or `/planner` if not admin |

### Rate Limits (Auth)

| Endpoint | Limit |
|----------|-------|
| `/api/auth/login` | 10/min |
| `/api/auth/register` | 5/min |
| `/api/auth/change-password` | 5/min |
| `/api/auth/forgot-password` | 3/min |
| `/api/auth/reset-password` | 5/min |

### Captcha (Turnstile)

Cloudflare Turnstile for bot protection on login, register, contact form, and optionally ride reports and forgot-password.
