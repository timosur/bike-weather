# BIKE-6: Authentication

| Field            | Value                                       |
| ---------------- | ------------------------------------------- |
| **ID**           | BIKE-6                                      |
| **Status**       | Deployed                                    |
| **Created**      | 2024-01-01                                  |
| **Dependencies** | BIKE-8 (Turnstile captcha for registration) |

## Description

Full authentication flow via Authentik (self-hosted OIDC). Includes in-app login, registration with Turnstile captcha, password recovery, password change, and OIDC callback. Backend validates JWTs against Authentik's JWKS endpoint and auto-creates users on first login.

## Scope

Sub-features and areas covered:

- Login page — username/password authentication via Authentik headless API
- Registration — in-app account creation with Turnstile captcha verification
- Forgot password — email-based password recovery (always returns 200 for privacy)
- Reset password — complete recovery with email token
- Change password — authenticated password change
- OIDC auth callback page
- Backend JWT/JWKS validation in API dependencies
- Auto-creation of user records on first OIDC login (`_find_or_create_user`)
- Rate limiting on auth endpoints (login: 10/min, register: 5/min, forgot: 3/min)

### Key Files

- `backend/app/api/routes/auth.py` — auth endpoints (login, register, change/forgot/reset password)
- `backend/app/api/dependencies.py` — JWT/JWKS validation, require_user, require_admin
- `backend/app/services/auth.py` — user lookup/creation logic
- `backend/app/services/headless_auth.py` — Authentik headless API client
- `backend/app/models/user.py` — User model (external_id, is_admin)
- `frontend/src/pages/LoginPage.tsx` — login form
- `frontend/src/pages/ForgotPasswordPage.tsx` — forgot password form
- `frontend/src/pages/ResetPasswordPage.tsx` — reset password form
- `frontend/src/pages/ChangePasswordPage.tsx` — change password form
- `frontend/src/pages/AuthCallbackPage.tsx` — OIDC callback handler
- `frontend/src/contexts/AuthContext.tsx` — OIDC auth state via oidc-client-ts
- `frontend/src/components/auth/` — auth form components
- `frontend/src/api/auth.ts` — API client for auth

## Acceptance Criteria (Summary)

- Users can log in with username and password
- New users can register with Turnstile captcha verification
- Forgot password sends a recovery email (response always 200)
- Reset password completes recovery with valid email token
- Authenticated users can change their password
- Backend validates JWT tokens against Authentik JWKS
- User records are auto-created on first OIDC login
- Auth endpoints are rate-limited

---

## Tech Design

_Retroactive — see `project/ARCHITECTURE.md`._

## QA Results

_No formal QA tracking for retroactive features._

## Deployment

_Deployed to production via ArgoCD. See release skill for version history._
