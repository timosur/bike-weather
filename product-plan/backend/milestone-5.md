# Milestone 5: Authentication via Authentik

## What

Replace the mock localStorage auth with Authentik as a self-hosted identity provider. Authentik handles registration, login, password hashing, Google OAuth, and token issuance. The backend only validates tokens. The frontend uses OIDC Authorization Code flow with PKCE.

## Architecture

```
Frontend  ──OIDC redirect──►  Authentik  (login/register/Google OAuth)
   │                              │
   │◄──access_token + id_token────┘
   │
   │──Authorization: Bearer──►  Backend (validates JWT, extracts user)
```

- Authentik issues JWTs (access + refresh tokens) via standard OIDC.
- Backend validates tokens using Authentik's JWKS endpoint (public keys). No shared secret needed.
- User records in the backend DB are created on first authenticated request (JIT provisioning from token claims).

## Infrastructure files

- Modify `docker-compose.yml` — Add Authentik services:
  - `authentik-server` — Main Authentik container
  - `authentik-worker` — Background worker
  - `authentik-redis` — Redis for Authentik caching/sessions
  - Authentik uses the existing PostgreSQL instance (separate database) or its own PostgreSQL container
- `authentik/` — Optional: blueprint YAML files for automated setup of:
  - OAuth2/OIDC provider configured for the frontend
  - Application registration
  - Google OAuth source (social login)
  - Default flows (login, registration, recovery)

## Backend files

- `backend/app/config.py` — Add settings: AUTHENTIK_ISSUER_URL, AUTHENTIK_JWKS_URL (derived), AUTHENTIK_AUDIENCE
- `backend/app/services/auth.py`:
  - Fetch and cache JWKS from Authentik (refresh periodically)
  - `validate_token(token: str) → TokenClaims` — Verify signature, exp, iss, aud; extract sub, email, name
- `backend/app/api/dependencies.py`:
  - `get_current_user` — Decode JWT via auth service, find-or-create User in DB (JIT provisioning), return User. Raise 401 on invalid/expired token.
  - `get_optional_user` — Same but returns None when no auth header present.
- `backend/app/schemas/auth.py` — UserResponse (id, email, name, avatar_url)
- `backend/app/api/routes/auth.py`:
  - `GET /api/auth/me` — Return current user profile from DB (requires auth)
- Remove: No register, login, refresh, or Google OAuth endpoints on the backend — Authentik handles all of that.
- Remove from `pyproject.toml`: passlib[bcrypt], python-jose[cryptography], authlib (replace with PyJWT or python-jose for JWKS validation only, or use `authlib` just for JWT decode)

## Frontend files

- New `frontend/src/auth/oidc.ts` — OIDC client configuration:
  - Authentik issuer URL, client ID, redirect URI, scopes (openid, profile, email)
  - Authorization Code flow with PKCE (no client secret in the frontend)
  - Use `oidc-client-ts` library or manual implementation
- New `frontend/src/contexts/AuthContext.tsx`:
  - On mount: check for tokens in storage, validate expiry
  - `login()` → redirect to Authentik login page
  - `logout()` → clear tokens + redirect to Authentik logout endpoint (RP-initiated logout)
  - `handleCallback()` → exchange auth code for tokens on redirect back
  - Provides: user, login(), logout(), isAuthenticated, isLoading
  - Auto-refresh: use refresh token to get new access token before expiry
- Modify `frontend/src/api/client.ts` — Read access token from storage, inject Authorization header, handle 401 → trigger re-auth
- Modify `frontend/src/App.tsx`:
  - Wrap in `<AuthProvider>`
  - Add `/auth/callback` route for OIDC redirect handling
  - Remove USER_STORAGE_KEY, loadUser(), handleAuthSuccess
  - RequireAuth reads from context
- Modify `frontend/src/pages/LoginPage.tsx`:
  - Remove simulateAuth() and mock logic
  - Login button redirects to Authentik (no local form for email/password — Authentik handles the UI)
  - Or: embed Authentik's login flow in an iframe/redirect

## Implementation guidelines

- **JWKS caching**: Fetch Authentik's JWKS on backend startup and cache it. Refresh every 1h or on signature verification failure (key rotation support).
- **JIT user provisioning**: On first authenticated API call, create a User row in the backend DB from token claims (`sub` as external ID, `email`, `name`). On subsequent calls, look up by `sub`. This keeps user data in sync without manual registration.
- **Token validation**: Verify `iss` matches Authentik issuer URL, `aud` matches the configured client ID, `exp` is not past, and signature is valid against JWKS.
- **Authentik setup**: Document the manual Authentik setup steps (create provider, application, configure Google OAuth source) or provide blueprint YAML for automated provisioning.
- **PKCE**: The frontend must use Authorization Code flow with PKCE (Proof Key for Code Exchange) since it's a public client (no client secret).
- **Add a `create_test_user` fixture** in conftest.py — creates a User in the DB and returns a mock JWT (signed with a test key). Override the `get_current_user` dependency to accept test tokens. Reuse in M6+ tests.
- **Logout**: Use Authentik's RP-initiated logout endpoint to invalidate the session on Authentik's side, not just clearing local tokens.

## Tests

- `tests/test_services/test_auth.py` (unit — mock JWKS endpoint):
  - `test_validate_token_valid` — Given a JWT signed with the test key, returns correct claims.
  - `test_validate_token_expired_raises` — Expired token raises appropriate error.
  - `test_validate_token_wrong_issuer_raises` — Token with wrong issuer is rejected.
  - `test_validate_token_wrong_audience_raises` — Token with wrong audience is rejected.
  - `test_validate_token_invalid_signature_raises` — Token signed with unknown key is rejected.
  - `test_jwks_cache_refreshes` — After cache TTL, JWKS is re-fetched.
- `tests/test_api/test_auth.py`:
  - `test_me_returns_user_profile` — GET /api/auth/me with valid token returns user data.
  - `test_me_creates_user_on_first_call` — First authenticated request creates User row in DB (JIT provisioning).
  - `test_me_returns_existing_user_on_subsequent_calls` — Second call returns same user, no duplicate created.
  - `test_me_without_token_returns_401` — No Authorization header returns 401.
  - `test_me_with_invalid_token_returns_401` — Malformed/expired token returns 401.
- `tests/test_api/test_dependencies.py`:
  - `test_get_current_user_valid_token` — Returns user object for valid test token.
  - `test_get_current_user_invalid_token_raises_401` — Raises 401 for garbage token.
  - `test_get_optional_user_no_token_returns_none` — Returns None when no auth header present.
  - `test_get_optional_user_valid_token_returns_user` — Returns user when valid token present.

## Verify

- `docker compose up` → Authentik UI accessible at localhost:9000
- Navigate to protected route → redirected to Authentik login
- Register via Authentik → redirected back → user menu appears
- Login via Authentik → access token in storage → API calls work
- Google OAuth via Authentik → login with Google → redirected back → logged in
- Logout → tokens cleared → Authentik session ended → redirected to home
- Expired token → auto-refresh works transparently
- `pytest` passes all tests (including M1–M4)
