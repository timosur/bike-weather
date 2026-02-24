# Milestone 3: Geocoding Proxy

## What

Location search in the planner goes through the backend instead of calling Nominatim directly.

## Backend files

- `backend/app/schemas/geocoding.py` — LocationSuggestionResponse matching frontend LocationSuggestion
- `backend/app/services/geocoding.py` — Nominatim proxy with asyncio.Lock-based 1 req/sec throttle, httpx client
- `backend/app/api/routes/geocoding.py`:
  - `GET /api/geocoding/search?q=...&limit=5` → forward search
  - `GET /api/geocoding/reverse?lat=...&lon=...` → reverse geocoding

## Frontend files

- New `frontend/src/api/geocoding.ts` — searchLocations(query), reverseGeocode(lat, lon)
- Modify `frontend/src/hooks/useLocationSearch.ts` — Replace direct NOMINATIM_BASE fetch calls with searchLocations() and reverseGeocode() from api module

## Implementation guidelines

- The geocoding service should be a standalone class/module that takes an httpx.AsyncClient — makes it easy to inject a mock client in tests.
- Throttle with `asyncio.Lock` + `asyncio.sleep` to respect Nominatim's 1 req/sec policy. This is server-global, not per-user.
- Set a proper `User-Agent` header on Nominatim requests (required by their usage policy).
- Handle upstream errors gracefully: if Nominatim returns 5xx or times out, return an empty result list with a 200 (not a 500). Log the error.
- Use httpx timeout settings (e.g. 5s connect, 10s read) to avoid hanging on slow upstream responses.

## Tests

- `tests/test_services/test_geocoding.py` (unit — mock httpx):
  - `test_search_returns_parsed_suggestions` — Given a mock Nominatim JSON response, service returns correctly shaped LocationSuggestion list.
  - `test_search_empty_query_returns_empty` — Empty or whitespace query returns empty list without calling Nominatim.
  - `test_search_nominatim_error_returns_empty` — If Nominatim returns 500, service returns empty list (no exception raised).
  - `test_search_respects_limit` — Limit parameter is forwarded to Nominatim query.
  - `test_reverse_returns_location` — Given mock Nominatim reverse response, service returns a single LocationSuggestion.
  - `test_throttle_delays_concurrent_requests` — Two rapid calls take at least 1s total (throttle works).
- `tests/test_api/test_geocoding.py` (integration — mock httpx at service level):
  - `test_search_endpoint_returns_suggestions` — GET /api/geocoding/search?q=Berlin returns suggestions.
  - `test_search_endpoint_missing_query_returns_422` — Missing `q` param returns 422.
  - `test_reverse_endpoint_returns_location` — GET /api/geocoding/reverse?lat=...&lon=... returns location.
  - `test_reverse_endpoint_missing_params_returns_422` — Missing lat or lon returns 422.

## Verify

- Type in planner location field → suggestions appear (from backend proxy)
- Click "Detect location" → reverse geocoding works through backend
- Backend logs show Nominatim requests being throttled
- `pytest` passes all tests (including M1–M2)
