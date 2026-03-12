---
applyTo: "backend/app/api/**,.env*,docker-compose.yml"
---

# Security Instructions

## Secrets

- **Never** commit secrets, API keys, or tokens to the repository
- All secrets go in `.env` (gitignored) — document new secrets in `.env.example`
- Docker Compose reads secrets from `.env` via `env_file`

## Authentication

- All auth flows go through **Authentik** (self-hosted OIDC) — never implement custom auth
- Backend validates JWTs via JWKS endpoint from Authentik
- Token storage: `localStorage` on frontend (OIDC tokens from Authentik)
- Admin access: `is_admin` claim in JWT, checked by `get_admin_user` dependency

## Input Validation

- **Backend:** Pydantic/SQLModel validation on all request bodies — never trust raw input
- **Frontend:** Client-side validation is UX only — all real validation happens server-side
- Sanitize user-provided content before rendering (XSS prevention)

## Rate Limiting

- slowapi on all public-facing endpoints (login, register, report generation, contact form)
- Turnstile captcha as secondary protection after throttle threshold
- Rate limit config in backend settings

## API Security

- CORS configured for allowed origins only
- Auth dependency (`Depends(get_current_user)`) on all protected routes
- Admin dependency (`Depends(get_admin_user)`) on admin routes
- Never expose internal errors to clients — use generic error responses
