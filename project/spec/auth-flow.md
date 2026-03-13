# Authentication & Authorization Flow

> Last updated by spec-docs skill. Reflects codebase as of the latest run.

## Overview

Authentication is handled by **Authentik** (self-hosted OIDC provider). The backend proxies Authentik's headless authentication API for login, registration, and password flows, returning OIDC tokens to the frontend. The frontend stores tokens in localStorage and attaches them as Bearer tokens on API requests.

## Identity Provider

- **Provider:** Authentik (ghcr.io/goauthentik/server:2025.12.3)
- **Protocol:** OpenID Connect (OIDC)
- **Port:** 9000 (dev)
- **Provisioning:** `scripts/setup_authentik.py` creates the OAuth2 application and provider

## Authentication Flows

### Login

1. User enters username + password on `/login`
2. Frontend calls `POST /api/auth/login` with credentials + optional Turnstile captcha token
3. Backend verifies Turnstile token, then calls Authentik's headless login API (`headless_auth.py`)
4. Authentik returns OIDC tokens (access_token, id_token)
5. Backend creates/updates the local `User` row from the id_token claims
6. Backend returns tokens to frontend
7. Frontend stores tokens in localStorage (`bike-weather:auth` key)
8. Frontend extracts user profile from id_token JWT claims (sub, email, name, is_admin)
9. Frontend calls `GET /api/auth/me` to get authoritative `is_admin` from the database

### Registration

1. User enters username, email, password, optional name on the login page
2. Frontend calls `POST /api/auth/register` with Turnstile captcha
3. Backend calls Authentik's headless registration API
4. Same token flow as login (steps 5–9)

### Password Recovery

1. User clicks "Forgot password" → `/forgot-password`
2. Frontend calls `POST /api/auth/forgot-password` with email + optional captcha
3. Backend calls Authentik's headless recovery start API
4. Always returns 200 (prevents user enumeration)
5. User receives email with recovery token/link
6. User enters new password on `/reset-password`
7. Frontend calls `POST /api/auth/reset-password` with token + new password
8. Backend calls Authentik's headless recovery complete API

### Password Change (Authenticated)

1. Authenticated user navigates to `/change-password`
2. Frontend calls `POST /api/auth/change-password` with current and new password
3. Backend calls Authentik's headless change-password API using the user's email

## Token Management

### Frontend (AuthContext)

- Tokens stored in localStorage as JSON: `{ access_token, id_token, expires_at, profile }`
- On app load: checks localStorage for valid (non-expired) tokens, restores session
- On login/register: stores new tokens, extracts profile from id_token
- `getAccessToken()`: returns the stored access_token (used by `apiFetch()` via `setAccessTokenProvider`)
- On logout: clears localStorage entry, sets user to null
- No token refresh implemented — expired tokens are cleared and user must re-login

### Backend (JWT Validation)

- `auth_service.validate_token(token)` validates the JWT using Authentik's JWKS endpoint
- Returns `TokenClaims` (sub, email, name) on success
- Raises `AuthenticationError` on failure

## Authorization

### Backend Dependencies

| Dependency | Behavior |
|------------|----------|
| `get_current_user` | Validates Bearer token, finds/creates User in DB. Returns 401 if no/invalid token. In DEBUG mode, supports `X-Dev-User-Email` header bypass. |
| `get_optional_user` | Same as above but returns `None` instead of 401 when no token is present. Used for endpoints that work for both anonymous and authenticated users. |
| `require_admin` | Wraps `get_current_user`, additionally checks `user.is_admin`. Returns 403 if not admin. |

### Frontend Route Guards

| Guard | Behavior |
|-------|----------|
| `RequireAuth` | Redirects to `/login` (with return path) if user is not authenticated |
| `RequireAdmin` | Redirects to `/login` if not authenticated, redirects to `/planner` if authenticated but not admin |

### Protected Routes

- `/routes` — RequireAuth
- `/change-password` — RequireAuth
- `/admin/*` — RequireAdmin

### Admin Grant/Revoke

Admin status is managed directly in the database:

```bash
make admin-grant EMAIL=user@example.com    # Sets is_admin = true
make admin-revoke EMAIL=user@example.com   # Sets is_admin = false
```

## Dev Mode Auth Bypass

When `DEBUG=true` in settings, the backend accepts an `X-Dev-User-Email` header to bypass real JWT validation. This looks up the user by email and returns them directly, enabling testing without Authentik.

## Rate Limiting

Auth endpoints are rate-limited via slowapi:

| Endpoint | Limit |
|----------|-------|
| `/api/auth/login` | 10/minute |
| `/api/auth/register` | 5/minute |
| `/api/auth/change-password` | 5/minute |
| `/api/auth/forgot-password` | 3/minute |
| `/api/auth/reset-password` | 5/minute |

## Captcha (Turnstile)

Cloudflare Turnstile is used as a bot protection layer:

- **Login/Register:** Captcha token sent from frontend, verified server-side before proceeding
- **Contact form:** Always requires captcha
- **Ride report:** Optional — frontend sends captcha token after a throttle threshold
- **Forgot password:** Optional captcha verification
