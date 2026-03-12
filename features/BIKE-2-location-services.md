# BIKE-2: Location Services

| Field            | Value      |
| ---------------- | ---------- |
| **ID**           | BIKE-2     |
| **Status**       | Deployed   |
| **Created**      | 2024-01-01 |
| **Dependencies** | None       |

## Description

Location autocomplete and reverse geocoding for the ride planner. Uses Nominatim for address search suggestions and lat/lon-to-address resolution. Includes a routing service for distance/geometry calculation between waypoints.

## Scope

Sub-features and areas covered:

- Location autocomplete search via Nominatim geocoding API
- Reverse geocoding ("Use my location") — resolves browser geolocation coordinates to a display address
- Routing service for calculating route distance and geometry between points

### Key Files

- `backend/app/api/routes/geocoding.py` — GET /api/geocoding/search, GET /api/geocoding/reverse
- `backend/app/services/geocoding.py` — Nominatim API integration
- `backend/app/services/routing.py` — route distance/geometry calculation
- `frontend/src/api/geocoding.ts` — API client for geocoding
- `frontend/src/components/ride-planner/` — location input with autocomplete

## Acceptance Criteria (Summary)

- Typing in the location field returns autocomplete suggestions from Nominatim
- "Use my location" button resolves current coordinates to a readable address
- Routing service calculates distance between start and end points
- Geocoding endpoints handle empty/invalid queries gracefully

---

## Tech Design

_Retroactive — see `docs/spec/architecture.md` and `docs/spec/api.md`._

## QA Results

_No formal QA tracking for retroactive features._

## Deployment

_Deployed to production via ArgoCD. See release skill for version history._
