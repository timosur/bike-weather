# Plan: Mandatory Destination + Unified Waypoints

## Problem
1. Destination is currently optional — it should be mandatory for all rides.
2. No waypoint support exists — users should be able to add intermediate stops.
3. Multi-day and single-day rides use different concepts (toggle + dayStops vs nothing) — unify them via a single waypoint model with "stop" and "sleep" types.

## Approach
Replace the current `isMultiDay` toggle + `dayStops` array + optional `destination` with:
- **Mandatory destination** (always required)
- **Optional distance** (auto-filled from OSRM routing)
- **Unified waypoints array** where each waypoint has a type:
  - `"stop"` — pass-through point affecting routing (no overnight)
  - `"sleep"` — overnight stop (advances the day, shows next-day start time + planned km)
- The ride is automatically multi-day when ≥1 waypoint has type `"sleep"`
- OSRM routes through all waypoints (start → W1 → W2 → … → destination)
- **Optional imported geometry** — when a route is imported (future: GPX/Komoot), the exact polyline is stored and OSRM routing is skipped

## Backward Compatibility
- Saved routes store `ride_input` as JSONB — old format (with `isMultiDay`/`dayStops`) must still load correctly.
- Backend will accept both old and new formats during a transition period.

---

## Tasks

### 1. Backend Schema Changes
**Files:** `backend/app/schemas/ride.py`

- Replace `DayStopSchema` with `WaypointSchema`:
  ```python
  class WaypointSchema(BaseModel):
      location: RideLocationSchema
      type: Literal["stop", "sleep"] = "stop"
      name: str | None = None                 # optional label ("Lunch stop", "Mountain pass")
      plannedKm: float | None = None          # optional km for next segment
      startTime: str | None = None            # HH:MM — departure time after sleep
  ```
- Update `RideLocationSchema`:
  - `address: str | None = None` (make optional — imported routes may only have coordinates)
- In `RideInputSchema`:
  - `destination: RideLocationSchema` (required, remove `| None = None`)
  - `distanceKm: float | None = None` (stays optional)
  - Replace `dayStops: list[DayStopSchema]` → `waypoints: list[WaypointSchema] = []`
  - Remove `isMultiDay: bool` field
  - Remove `endDate: str | None` field (frontend derives it from startDate + sleep waypoint count)
  - Add `importedGeometry: list[list[float]] | None = None` (for future GPX/Komoot import — stores exact polyline, skips OSRM when present)
- Add backward-compat `model_validator` to migrate old `dayStops` + `isMultiDay` → `waypoints`

### 2. Backend Routing Service — Waypoint Support
**Files:** `backend/app/services/routing.py`

- Update `get_route()` signature to accept `waypoints: list[tuple[float, float]] = []`
- Build OSRM coordinate string: `start;wp1;wp2;...;dest` (semicolon-separated)
- Update cache key to include waypoints
- **Add early-return path**: when `importedGeometry` is provided, skip OSRM call and return geometry directly (calculate distance from coordinate pairs)

### 3. Backend Route Preview Endpoint — Waypoint Support
**Files:** `backend/app/api/routes/rides.py`

- Change `preview_route` from GET with query params to POST with body:
  ```python
  class RoutePreviewRequest(BaseModel):
      startLat: float
      startLon: float
      destLat: float
      destLon: float
      waypoints: list[list[float]] = []  # [[lat, lon], ...]
  ```
- Pass waypoints through to routing service

### 4. Backend Recommendations — Unified Waypoint Logic
**Files:** `backend/app/services/recommendations.py`

- Replace multi-day detection: `is_multi_day = any(wp.type == "sleep" for wp in ride_input.waypoints)`
- Build `day_locations` from sleep waypoints instead of `dayStops`
- Pass waypoint coordinates to routing when fetching route geometry
- Keep weather waypoint sampling (sample_weather_points) — these are different from user waypoints

### 5. Backend Report Schema Updates
**Files:** `backend/app/schemas/report.py`

- Add `waypoints` field to `RideReportSchema` for user-defined waypoints (not weather waypoints)
- Ensure `destinationLocation` is no longer optional in the report output

### 6. Frontend Types
**Files:** `frontend/src/components/ride-planner/types.ts`

- Add `Waypoint` type with `location`, `type`, `name`, `plannedKm`, `startTime`
- Update `RideInput`:
  - `destination: RideLocation` (required, not optional)
  - Remove `isMultiDay`, `endDate`, `dayStops`
  - Add `waypoints: Waypoint[]`
  - Add `importedGeometry?: number[][]` (for future route import)
- Update `RideLocation`:
  - `address` becomes optional (`address?: string`)

### 7. Frontend RidePlanner — Destination Mandatory + Remove Multi-Day Toggle
**Files:** `frontend/src/components/ride-planner/RidePlanner.tsx`

- Make destination always visible (remove `showDestination` toggle state)
- Add destination to validation (required)
- Remove distance from validation (optional, auto-filled)
- Remove `isMultiDay` toggle button
- Remove `DayLocationList` integration
- Add new `WaypointList` component integration
- Update route preview effect to include waypoint coordinates
- Derive `endDate` locally from startDate + count of sleep waypoints (no longer stored in schema)

### 8. Frontend WaypointList Component (replaces DayLocationList)
**Files:** `frontend/src/components/ride-planner/WaypointList.tsx` (new)

- Renders between start and destination in the form
- "Add waypoint" button
- Each waypoint row:
  - Location picker (reuse existing component)
  - Optional name/label input (placeholder: "Waypoint name")
  - Type toggle: stop 🚩 / sleep 🛏️
  - If sleep: start time input (default 08:00), planned km input
  - Remove button
- Auto-calculates day numbers based on sleep waypoints
- Emits `onChange(waypoints)` to parent

### 9. Frontend API Client Updates
**Files:** `frontend/src/api/rides.ts`

- Update `fetchRoutePreview` to POST with waypoints
- Update `RoutePreview` types if needed

### 10. Frontend RouteMap — Waypoint Markers
**Files:** `frontend/src/components/ride-report/RouteMap.tsx`

- Accept optional `waypoints` prop
- Render markers for user-defined waypoints (different icons for stop/sleep)

### 11. Frontend i18n
**Files:** `frontend/src/i18n/locales/de.json`, `frontend/src/i18n/locales/en.json`

- Remove: `addDestination`, `multiDayTour`, `overnightLocations`
- Add: waypoint-related keys (addWaypoint, waypointStop, waypointSleep, waypointName, removeWaypoint, etc.)
- Update validation keys (destination now required)

### 12. Cleanup Old DayLocationList
**Files:** `frontend/src/components/ride-planner/DayLocationList.tsx`

- Remove file (replaced by WaypointList)
- Remove any remaining imports

### 13. Backend Tests
- Update existing tests for new schema (destination required, waypoints instead of dayStops)
- Add test for backward-compat validator (old dayStops → waypoints migration)
- Add test for routing with waypoints
- Add test for `importedGeometry` early-return path in routing service
- Add test for `RideLocationSchema` with missing address (coordinates only)

### 14. Frontend Build Verification
- Run `cd frontend && npm run build` to verify TypeScript compiles
- Run `cd backend && uv run pytest` for backend tests
