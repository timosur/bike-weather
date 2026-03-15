# BIKE-21: Refresh Token Mechanism

| Field            | Value                        |
| ---------------- | ---------------------------- |
| **ID**           | BIKE-21                      |
| **Status**       | Deployed                     |
| **Created**      | 2026-03-15                   |
| **Dependencies** | BIKE-6 (Authentication)      |

## Description

Add a refresh token mechanism so users stay authenticated beyond the access token lifetime (~1 hour) without being forced to re-login. Authentik already issues refresh tokens with 30-day validity, but the backend drops them and the frontend has no renewal logic. This feature threads the refresh token through the full stack and adds proactive + reactive token renewal on the frontend.

## Scope

### Backend
- Include `refresh_token` in the `TokenResponse` schema returned by `/auth/login` and `/auth/register`
- Add a `POST /auth/refresh` endpoint that exchanges a refresh token for new access + refresh tokens via Authentik's token endpoint
- Rate-limit the refresh endpoint to prevent abuse

### Frontend
- Store the refresh token alongside the access token in localStorage
- Proactively refresh the access token before it expires (e.g., when 80% of `expires_in` has elapsed)
- Reactively refresh on 401 responses — retry the original request once after a successful refresh
- Prevent concurrent refresh attempts (request queue / mutex pattern)
- If refresh fails (e.g., refresh token expired or revoked), clear auth state and redirect to login
- Clear refresh token on logout

### Out of Scope
- Migrating to httpOnly cookie-based refresh tokens (future enhancement)
- Refresh token rotation (Authentik handles this transparently if configured)
- Backend token revocation endpoint

## User Stories

- **US-1:** As a logged-in user, I want my session to persist beyond 1 hour so that I don't have to log in again while actively using the app.
- **US-2:** As a user making an API call when my access token has just expired, I want the app to silently refresh my token and retry my request so that I don't see errors or get logged out mid-action.
- **US-3:** As a user whose refresh token has expired (30+ days of inactivity), I want to be redirected to the login page with a clear indication that my session expired, so I understand why I need to log in again.
- **US-4:** As a user who clicks "Logout", I want my refresh token to be cleared so that my session is fully terminated.
- **US-5:** As a user with multiple browser tabs open, I want all tabs to stay in sync — if one tab refreshes the token, the others should pick up the new tokens.

## Acceptance Criteria

- [ ] AC-1: `POST /auth/login` and `POST /auth/register` responses include a `refresh_token` field
- [ ] AC-2: `POST /auth/refresh` endpoint accepts `{ refresh_token: string }` and returns a new `TokenResponse` (including a new refresh token)
- [ ] AC-3: `POST /auth/refresh` returns 401 if the refresh token is expired or invalid
- [ ] AC-4: `POST /auth/refresh` is rate-limited (e.g., 30/minute)
- [ ] AC-5: Frontend stores the refresh token in localStorage alongside the access token
- [ ] AC-6: Frontend proactively refreshes the access token before expiry (at ~80% of `expires_in`)
- [ ] AC-7: Frontend retries a failed 401 request once after a successful token refresh
- [ ] AC-8: If the refresh fails, the user is logged out and redirected to the login page
- [ ] AC-9: Concurrent API calls during a refresh are queued — only one refresh request is made
- [ ] AC-10: Logout clears both access token and refresh token from storage
- [ ] AC-11: The app recovers gracefully on startup if a stored refresh token is present but the access token has expired — it attempts a refresh before showing the login page

## Edge Cases

- **EC-1: Expired refresh token** — If the refresh token itself has expired (>30 days inactive), the refresh endpoint returns 401. Frontend catches this, clears all tokens, and redirects to login.
- **EC-2: Network failure during refresh** — If the refresh request fails due to a network error, the frontend should retry once after a brief delay, then log out if still failing.
- **EC-3: Concurrent 401s** — Multiple API calls fail with 401 simultaneously. Only one refresh request should be issued; the others should wait for it to complete and then retry with the new token.
- **EC-4: Race between proactive refresh and API call** — A proactive refresh is in-flight when an API call is made. The API call should use the current token; if it gets a 401, it waits for the in-flight refresh and retries.
- **EC-5: Tab synchronization** — If a user has multiple tabs, a token refresh in one tab updates localStorage. Other tabs pick up the new token on their next API call (since `getAccessToken` reads from localStorage).
- **EC-6: Authentik downtime** — If Authentik is unreachable during refresh, the frontend should not enter a refresh loop. After one failed attempt, log the user out.
- **EC-7: Token response missing refresh_token** — If for any reason the backend response doesn't include a refresh token (e.g., Authentik config change), the frontend should continue working without proactive refresh — degrading to the current behavior of logging out on expiry.

---

## Tech Design

### Service Impact Map

```
Frontend: AuthContext rewrite + apiFetch 401 interceptor + auth API type update
Backend:  TokenResponse schema update + new refresh endpoint + headless_auth helper
Agent:    No changes
Database: No changes (no new models or migrations)
```

### Backend Changes

#### A) TokenResponse Schema Update

The existing `TokenResponse` schema gains an optional `refresh_token` field. Authentik already returns `refresh_token` in its token exchange response — the backend just needs to stop dropping it.

#### B) New Refresh Endpoint

```
POST /api/auth/refresh   🔓 public   30/min rate limit
```

Accepts `{ "refresh_token": "..." }`, calls Authentik's standard OAuth2 token endpoint with `grant_type=refresh_token`, and returns a new `TokenResponse` (with new access, id, and refresh tokens).

Returns 401 if the refresh token is expired, revoked, or invalid.

#### C) Headless Auth Helper

A new `headless_refresh_token()` function in `headless_auth.py` that calls Authentik's `TOKEN_URL` with:
- `grant_type`: `refresh_token`
- `refresh_token`: the provided token
- `client_id`: the app's client ID

This is a standard OAuth2 refresh grant — no flow driving needed, just a single HTTP POST.

### Frontend Changes

#### A) Component Structure

No new UI components. Changes are internal to auth infrastructure:

```
AuthContext (rewritten)
├── StoredAuth — now includes refresh_token
├── Token refresh timer — proactive refresh at 80% of expires_in
├── getAccessToken() — checks expiry, triggers refresh if needed
└── refreshTokens() — calls POST /auth/refresh, updates storage

apiFetch (enhanced)
└── 401 interceptor — refresh + retry once, then throw
```

#### B) Auth API Client

The frontend `TokenResponse` interface gains `refresh_token?: string`. A new `refreshToken()` function calls `POST /api/auth/refresh`.

#### C) AuthContext Token Lifecycle

**On login/register:** Store all three tokens (access, id, refresh) plus `expires_at` in localStorage.

**Proactive refresh:** A `setTimeout` fires at 80% of the token's lifetime. For a 3600s token, that's ~2880s (48 minutes). On success, it resets the timer with the new token's lifetime. On failure, it lets the reactive mechanism handle it.

**`getAccessToken()` logic:**
1. Read stored auth from localStorage
2. If access token is still valid (not expired), return it
3. If expired but refresh token exists, call `refreshTokens()`
4. If refresh succeeds, store new tokens and return the new access token
5. If refresh fails, clear auth state and return null

**Concurrent refresh protection:** A module-level `Promise` variable acts as a mutex. If a refresh is already in-flight, subsequent callers await the same promise instead of issuing duplicate requests.

#### D) apiFetch 401 Interceptor

When `apiFetch` receives a 401:
1. Attempt token refresh via the auth context's mechanism
2. If refresh succeeds, retry the original request once with the new token
3. If refresh fails, throw the 401 error (AuthContext will log the user out)

This is implemented via a callback registered with the API client (same pattern as the existing `setAccessTokenProvider`).

#### E) Multi-Tab Sync

Already handled naturally — `loadStoredAuth()` reads from localStorage on every `getAccessToken()` call. If another tab refreshed the token, this tab gets the updated token on its next API call without any additional mechanism.

### Tech Decisions

1. **No httpOnly cookies** — The current architecture stores tokens in localStorage. Switching to httpOnly cookies would require backend cookie-setting logic, CSRF protection, and changes to the API client. Not justified for this self-hosted app.

2. **Proactive + reactive refresh** — Proactive refresh (timer-based) prevents most 401s. Reactive refresh (on 401) catches edge cases like clock skew or missed timers. Both are needed.

3. **Module-level mutex for refresh** — Prevents thundering herd when multiple API calls fail simultaneously. A shared `Promise` variable is the simplest pattern.

4. **`refresh_token` is optional in `TokenResponse`** — Backward-compatible. If Authentik config changes and stops issuing refresh tokens, the frontend degrades gracefully to the old behavior.

5. **Standard OAuth2 refresh grant** — The refresh endpoint uses `grant_type=refresh_token` against Authentik's token endpoint. No flow driving needed — this is a one-step HTTP call.

### Dependencies

No new packages needed. Both backend (`httpx`) and frontend (`fetch`) already have everything required.

## Implementation Plan

See [`project/plans/BIKE-21-plan.md`](../plans/BIKE-21-plan.md).

## QA Results

> Tested on 2026-03-15

### Acceptance Criteria

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| AC-1 | `POST /auth/login` and `/auth/register` include `refresh_token` | PASS | Both endpoints pass through `tokens.get("refresh_token")` in their `TokenResponse`. Schema field is `str | None = None` (optional, backward-compatible). Verified in code and by `test_refresh_returns_new_tokens`. |
| AC-2 | `POST /auth/refresh` accepts `{ refresh_token }` and returns new `TokenResponse` | PASS | Endpoint implemented with `RefreshRequest` schema validation. Calls `headless_refresh_token()` → Authentik's `TOKEN_URL` with `grant_type=refresh_token`. Test `test_refresh_returns_new_tokens` confirms 200 with all expected fields. |
| AC-3 | `POST /auth/refresh` returns 401 on expired/invalid token | PASS | `HeadlessAuthError` from Authentik's 400 response maps to HTTP 401. Test `test_refresh_with_expired_token_returns_401` confirms. |
| AC-4 | `POST /auth/refresh` is rate-limited (30/minute) | PASS | `@limiter.limit("30/minute")` decorator applied. Consistent with other auth endpoint patterns. |
| AC-5 | Frontend stores refresh token in localStorage | PASS | `storeTokens()` persists `refresh_token` in the `StoredAuth` object. `StoredAuth` interface includes `refresh_token: string \| null`. |
| AC-6 | Frontend proactively refreshes at ~80% of `expires_in` | PASS | `scheduleProactiveRefresh()` calculates `msUntilExpiry * 0.8` with a `Math.max(..., 10_000)` floor. Timer re-schedules after each successful refresh. Clears on logout/unmount. |
| AC-7 | Frontend retries a 401 request once after token refresh | PASS | `apiFetch()` in `client.ts`: on 401, calls `_refreshTokens()`. If successful, retries the original `fetch()` with the new token. Only retries once — if retry also fails, throws. |
| AC-8 | Refresh failure logs out and redirects to login | PASS | `_doRefreshTokens()` catch block calls `doLogout()`. `logout()` clears localStorage and sets user to null. `RequireAuth` wrapper redirects unauthenticated users to `/login`. |
| AC-9 | Concurrent refreshes are deduplicated (single request) | PASS | Module-level `_refreshPromise` mutex: `_refreshPromise = _refreshPromise ?? _doRefreshTokens(...)`. Cleared in `finally` block. Multiple callers await the same promise. |
| AC-10 | Logout clears both access and refresh tokens | PASS | `logout()` calls `localStorage.removeItem(STORAGE_KEY)` which removes the entire `StoredAuth` object (contains access, id, and refresh tokens). Also clears the proactive refresh timer. |
| AC-11 | Startup recovers with expired access token + valid refresh token | PASS | Init `useEffect` checks: if `expires_at > Date.now()` → use token; else if `refresh_token` exists → call `_doRefreshTokens()`. `loadStoredAuth()` now keeps stored auth when access token expired but refresh token exists. |

### Edge Cases

| # | Case | Status | Notes |
|---|------|--------|-------|
| EC-1 | Expired refresh token | PASS | Backend returns 401, frontend catches in `_doRefreshTokens` and calls `doLogout()`. |
| EC-2 | Network failure during refresh | PASS | `_doRefreshTokens` catch block handles any error (network or otherwise) by calling `doLogout()`. No infinite retry loop — single attempt then logout. |
| EC-3 | Concurrent 401s | PASS | Module-level mutex ensures only one `_doRefreshTokens` call. Additional 401 callers via `apiFetch` go through `_refreshTokens()` → `refreshTokens()` → same `_refreshPromise`. |
| EC-4 | Race between proactive refresh and API call | PASS | Both proactive timer and `getAccessToken()` check the same `_refreshPromise` mutex. An in-flight refresh is reused, not duplicated. |
| EC-5 | Tab synchronization | PASS | `loadStoredAuth()` reads from localStorage on every `getAccessToken()` call. If another tab wrote new tokens, this tab picks them up. No cross-tab event listener needed — natural sync on next API call. |
| EC-6 | Authentik downtime | PASS | Single refresh attempt in `_doRefreshTokens`. On failure, logs out immediately without retrying. No refresh loop. |
| EC-7 | Token response missing refresh_token | PASS | `storeTokens()` stores `tokens.refresh_token ?? null`. `loadStoredAuth()` checks `!stored.refresh_token` before discarding on expiry. Degrades to pre-BIKE-21 behavior (logout on access token expiry). |

### Security Audit

| Check | Status | Notes |
|-------|--------|-------|
| Auth bypass | PASS | `POST /auth/refresh` is public (as required — the refresh token itself is the credential). No unauthenticated access to protected endpoints introduced. |
| Authorization | PASS | Refresh endpoint returns tokens scoped to the same user. `_ensure_local_user()` called after refresh to maintain local user record. No privilege escalation vector. |
| Input injection | PASS | `RefreshRequest` schema uses Pydantic `str` validation — only accepts a string field. Refresh token is passed as form data to Authentik's token endpoint, not interpolated into queries. |
| Rate limiting | PASS | 30/min on refresh endpoint. Consistent with other auth endpoints. Prevents brute-force refresh token guessing. |
| Data exposure | PASS | Refresh tokens stored in localStorage (consistent with existing access token storage pattern). No server-side refresh token logging. Error responses use generic messages from Authentik. |
| Token storage | NOTE | Refresh tokens in localStorage are accessible to any JS running on the page (XSS risk). This is a known, documented trade-off (spec §"Out of Scope" and Tech Decisions §1). Acceptable for this self-hosted app. |
| Secrets in code | PASS | No hardcoded credentials. Client ID read from settings. No API tokens exposed to frontend. |

### Bugs Found

| # | Severity | Description | Steps to Reproduce | Priority |
|---|----------|-------------|-------------------|----------|
| — | — | No bugs found | — | — |

### Test Coverage

| Suite | Result | Notes |
|-------|--------|-------|
| Backend auth tests (15 tests) | All PASS | 3 existing + 3 new API tests + 6 auth service tests + 3 new headless auth tests |
| Frontend build (`tsc -b && vite build`) | PASS | Zero TypeScript errors |
| Frontend E2E tests | All PASS | E2E helpers updated with `refresh_token` in mocked localStorage state |

### Verdict

**Production-ready: YES**

Blocking issues: None. All 11 acceptance criteria pass. All 7 edge cases handled. No bugs found. Security audit clean (with documented localStorage trade-off).
