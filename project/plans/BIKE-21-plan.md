# Plan: BIKE-21 — Refresh Token Mechanism

> Status: In Progress (Phases 1–4 complete)
> Feature spec: [BIKE-21](../features/BIKE-21-refresh-token.md)
> Created: 2026-03-15

## Phase 1: Backend — Schema & Refresh Endpoint

**Owner: Backend Developer**

- [x] Add optional `refresh_token: str | None = None` field to `TokenResponse` in `backend/app/schemas/auth.py`
- [x] Add `RefreshRequest` schema (with `refresh_token: str` field) to `backend/app/schemas/auth.py`
- [x] Add `headless_refresh_token(refresh_token: str) -> dict` function to `backend/app/services/headless_auth.py` — calls Authentik's `TOKEN_URL` with `grant_type=refresh_token`
- [x] Add `POST /auth/refresh` endpoint to `backend/app/api/routes/auth.py` — rate-limited at 30/min, accepts `RefreshRequest`, returns `TokenResponse`
- [x] Update the existing `login` endpoint to include `refresh_token` from Authentik's response in `TokenResponse`
- [x] Update the existing `register` endpoint to include `refresh_token` from Authentik's response in `TokenResponse`
- [x] Add tests for the refresh endpoint in `backend/tests/test_api/test_auth.py` — success case, expired token (401), missing token (422)
- [x] Add test for `headless_refresh_token` in `backend/tests/test_services/test_headless_auth.py` — mock the Authentik token URL call
- [x] **Checkpoint**: Run `make test-backend` — all tests pass. Manually test `POST /api/auth/login` and confirm response now includes `refresh_token` field.

## Phase 2: Frontend — Auth API & Token Storage

**Owner: Frontend Developer**

- [x] Add `refresh_token?: string` to the `TokenResponse` interface in `frontend/src/api/auth.ts`
- [x] Add `refreshToken(refreshToken: string): Promise<TokenResponse>` function to `frontend/src/api/auth.ts`
- [x] Update `StoredAuth` interface in `AuthContext.tsx` to include `refresh_token: string | null`
- [x] Update `storeTokens()` to persist `refresh_token` from `TokenResponse`
- [x] Update `loadStoredAuth()` to load `refresh_token` — do NOT discard stored auth when access token is expired (refresh token may still be valid)
- [x] **Checkpoint**: Build passes (`cd frontend && npm run build`). Login stores refresh token in localStorage (verify via browser DevTools).

## Phase 3: Frontend — Proactive & Reactive Refresh

**Owner: Frontend Developer**

- [x] Add `refreshTokens()` async function to `AuthContext.tsx` — calls `refreshToken()` API, updates storage and user state, returns new access token. On failure, calls `logout()`.
- [x] Add concurrent refresh mutex — a module-level `let refreshPromise: Promise<string | null> | null = null` that prevents duplicate refresh requests
- [x] Update `getAccessToken()` — if access token is expired but refresh token exists, trigger refresh. Use the mutex to deduplicate.
- [x] Add proactive refresh timer — `useEffect` that sets a `setTimeout` at 80% of `expires_in` duration. Clears on logout or unmount. Resets after each successful refresh.
- [x] Update app startup logic (`useEffect` in `AuthProvider`) — if stored access token is expired but refresh token exists, attempt refresh before falling back to logged-out state
- [x] **Checkpoint**: Build passes. Proactive refresh timer schedules at 80% of token lifetime. Startup handles expired access token with refresh.

## Phase 4: Frontend — 401 Retry in API Client

**Owner: Frontend Developer**

- [x] Add a `setTokenRefresher` callback registration to `frontend/src/api/client.ts` (same pattern as `setAccessTokenProvider`)
- [x] Update `apiFetch()` — on 401 response, call the token refresher callback. If it returns a new token, retry the request once. If it fails or returns null, throw the 401 error.
- [x] Register the token refresher in `App.tsx` alongside the existing `setAccessTokenProvider` call
- [x] Update E2E test helpers (`frontend/e2e/helpers/auth.ts`) to include `refresh_token` in mocked localStorage auth state
- [x] **Checkpoint**: Run `cd frontend && npm run build` — no type errors. E2E mocks updated.

## Phase 5: Integration & Documentation

**Owner: Backend Developer + Frontend Developer**

- [x] Update `project/ARCHITECTURE.md` — add `POST /api/auth/refresh` to the Auth endpoints table
- [ ] Run `make test-backend` — all backend tests pass
- [ ] Run `make test-frontend` — all E2E tests pass
- [ ] **Checkpoint**: Full feature walkthrough — log in, wait for proactive refresh (or simulate by adjusting `expires_at`), verify silent refresh. Open two tabs, refresh in one, verify other tab picks up new token. Test with expired refresh token — should redirect to login.
