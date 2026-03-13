# BIKE-5: Routes & Sharing

| Field            | Value                                          |
| ---------------- | ---------------------------------------------- |
| **ID**           | BIKE-5                                         |
| **Status**       | Deployed                                       |
| **Created**      | 2024-01-01                                     |
| **Dependencies** | BIKE-1 (ride reports), BIKE-6 (authentication) |

## Description

Authenticated users can save, edit, and delete favorite routes. Each saved route stores the full ride input for easy re-use. Routes can be shared via a public URL that generates a fresh report with current weather. Includes quick-check (tap to generate a report) and last-condition tracking.

## Scope

Sub-features and areas covered:

- My Routes page — list saved routes with last condition and quick-check
- Save route with name, location, distance, riding style, and full ride input (JSONB)
- Edit route name and parameters
- Delete saved routes
- Route sharing — generate a public share token/URL
- Revoke sharing for a route
- Shared report page — public unauthenticated view regenerated with current weather
- Quick check — tap a saved route to generate a fresh report
- Last condition tracking — stores weather condition from most recent report
- Route waypoints support

### Key Files

- `backend/app/api/routes/routes.py` — CRUD + share/unshare endpoints for saved routes
- `backend/app/api/routes/shared.py` — GET /api/shared/{token} public report
- `backend/app/models/saved_route.py` — SavedRoute model (with share_token, ride_input JSONB)
- `backend/app/services/route_waypoints.py` — waypoint management
- `frontend/src/pages/RoutesPage.tsx` — My Routes page
- `frontend/src/pages/SharedReportPage.tsx` — public shared report
- `frontend/src/components/my-routes/` — route list and management components
- `frontend/src/api/routes.ts` — API client for routes
- `frontend/src/api/shared.ts` — API client for shared reports

## Acceptance Criteria (Summary)

- Authenticated users can save, edit, and delete routes
- Saved routes store full ride input for one-tap re-use
- Share button generates a public URL; revoke button disables it
- Shared report page loads without authentication and shows current weather
- Last weather condition is displayed on the routes list
- Quick-check generates a fresh report for a saved route

---

## Tech Design

_Retroactive — see `project/spec/architecture.md` and `project/spec/api.md`._

## QA Results

_No formal QA tracking for retroactive features._

## Deployment

_Deployed to production via ArgoCD. See release skill for version history._
