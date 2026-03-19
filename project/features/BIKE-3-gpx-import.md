# BIKE-3: GPX Import

| Field            | Value                                |
| ---------------- | ------------------------------------ |
| **ID**           | BIKE-3                               |
| **Status**       | Deployed                             |
| **Created**      | 2024-01-01                           |
| **Dependencies** | BIKE-1 (planner), BIKE-2 (geocoding) |

## Description

Upload a GPX file (from Komoot, Strava, etc.) to pre-fill the ride planner with the route geometry, start/end locations, and distance. Backend parses the file with `gpxpy` and supports both `<trk>` (track) and `<rte>` (route) elements. Start and end points are reverse-geocoded to display addresses.

## Scope

Sub-features and areas covered:

- GPX file upload via planner UI (max 10 MB)
- Backend parsing with `gpxpy` library
- Support for `<trk>` and `<rte>` GPX elements
- Extraction of route geometry, start/end coordinates, and total distance
- Reverse geocoding of start/end points to readable addresses
- Pre-filling planner form with imported data

### Key Files

- `backend/app/api/routes/rides.py` — POST /api/rides/import/gpx endpoint
- `backend/app/services/gpx_parser.py` — GPX file parsing and data extraction
- `frontend/src/components/ride-planner/` — GPX upload button/UI
- `frontend/src/api/rides.ts` — API client for GPX import

## Acceptance Criteria (Summary)

- User can upload a `.gpx` file in the planner
- Backend parses both track and route elements
- Start and end locations are reverse-geocoded and populated in the form
- Route distance is calculated and pre-filled
- Invalid or empty GPX files return appropriate error messages
- File size limited to 10 MB

---

## Tech Design

_Retroactive — see `project/ARCHITECTURE.md`._
