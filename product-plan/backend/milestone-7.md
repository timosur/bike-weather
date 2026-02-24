# Milestone 7: Saved Routes API

## What

My Routes page persists to PostgreSQL via REST API instead of localStorage.

## Backend files

- `backend/app/schemas/route.py` — SavedRouteCreate, SavedRouteUpdate, SavedRouteResponse
- `backend/app/api/routes/routes.py`:
  - `GET /api/routes` — list user's routes (requires auth, sorted by last_used desc)
  - `POST /api/routes` — create route (requires auth)
  - `PUT /api/routes/{id}` — update route (verify ownership)
  - `DELETE /api/routes/{id}` — delete route (verify ownership)
- Modify `backend/app/api/routes/rides.py` — When route_id param provided + user authenticated: update last_condition and last_used on the saved route after generating report

## Frontend files

- New `frontend/src/api/routes.ts` — fetchRoutes(), createRoute(data), updateRoute(id, updates), deleteRoute(id)
- Modify `frontend/src/pages/RoutesPage.tsx`:
  - Remove STORAGE_KEY, loadRoutes(), persistRoutes(), sampleRoutes import
  - Use useEffect + fetchRoutes() on mount, add loading state
  - CRUD handlers call API, then re-fetch
- Modify `frontend/src/pages/ReportPage.tsx`:
  - Wire "Save Route" button → createRoute() with current report/input data
  - Pass routeId to fetchReport() when navigating from saved route

## Implementation guidelines

- **Ownership enforcement**: Every mutation (PUT, DELETE) must verify `route.user_id == current_user.id`. Return 404 (not 403) for routes owned by another user — don't leak existence of other users' routes.
- **Sorting**: Default sort by `last_used DESC, created_at DESC`. No pagination needed initially (users won't have thousands of routes), but structure the query so adding `limit`/`offset` later is trivial.
- **Route ID format**: Use UUID for route IDs (not sequential integers) to avoid enumeration.
- **Update semantics**: PUT replaces the fields provided. Fields not in the request body stay unchanged (partial update). Validate that immutable fields (user_id, id) can't be overwritten.
- **Ride report integration**: When `route_id` is provided to POST /api/rides/report and the user is authenticated, update the route's `last_condition` and `last_used` timestamp after generating the report. If the route doesn't exist or isn't owned by the user, silently skip the update (don't fail the report).

## Tests

- `tests/test_api/test_routes.py`:
  - `test_list_routes_empty` — New user has no routes, returns empty list.
  - `test_list_routes_returns_own_routes` — User sees only their own routes.
  - `test_list_routes_sorted_by_last_used` — Routes returned in last_used descending order.
  - `test_list_routes_unauthenticated_returns_401` — No token returns 401.
  - `test_create_route` — POST /api/routes with valid data returns 201 with route.
  - `test_create_route_missing_fields_returns_422` — Missing required fields returns 422.
  - `test_update_route` — PUT /api/routes/{id} updates the route name.
  - `test_update_route_other_user_returns_404` — Updating another user's route returns 404.
  - `test_delete_route` — DELETE /api/routes/{id} removes the route.
  - `test_delete_route_other_user_returns_404` — Deleting another user's route returns 404.
  - `test_delete_route_not_found_returns_404` — Deleting non-existent route returns 404.
  - `test_report_with_route_id_updates_condition` — POST /api/rides/report with route_id updates last_condition and last_used on the route.
  - `test_report_with_invalid_route_id_still_returns_report` — Report succeeds even if route_id is invalid.

## Verify

- Login → navigate to My Routes → empty (no seeded routes for new user)
- Plan a ride → report → click "Save" → route created
- My Routes → route appears → edit name → save → refreshed
- Delete route → confirmed → removed
- Select saved route → report loads → last_condition updated on return to My Routes
- `pytest` passes all tests (including M1–M6)
