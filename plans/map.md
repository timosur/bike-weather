# Plan: Optional Destination with Route, Headwind & Weather Map

## Problem

Currently, the ride planner only takes a single start location. Users want to optionally specify a destination, see the actual cycling route on a map, get headwind/tailwind analysis along the route, and view a detailed weather breakdown at waypoints along the route.

## Approach

Add an optional destination to the ride planner. When provided, the backend calculates the route via OSRM, samples weather every ~25km, computes wind impact per segment, and returns enriched data. The frontend renders the route on a Leaflet map (via shadcn-map) with color-coded wind/weather overlays, plus a new summary section in the ride report.

This applies to both single-day and multi-day rides.

## Key Technology Decisions

- **Map:** shadcn-map (Leaflet + React Leaflet wrapper styled for shadcn/ui)
- **Routing:** OSRM public demo server (`routing.openstreetmap.de/routed-bike/`) — free, no API key
- **Weather waypoints:** Sample every ~25km along the route
- **Display:** Map overlay (color-coded segments) + wind/weather summary section in report

---

## Todos

### 1. Backend: OSRM routing service (`backend/app/services/routing.py`)
Create a new routing service that calls the OSRM cycling profile API. Given start/destination coordinates, it returns:
- Full route geometry (as list of [lat, lon] points)
- Total distance (km) and estimated duration
- Step-by-step geometry for segments

The service should decode OSRM's polyline geometry, handle errors/retries, and cache results.

### 2. Backend: Route waypoint sampling utility (`backend/app/services/route_waypoints.py`)
Create a utility that takes a route geometry (list of coordinates) and samples waypoints every ~25km. Each waypoint has: index, lat, lon, distance_from_start_km, bearing (travel direction at that point). The bearing is needed for headwind calculation.

### 3. Backend: Wind analysis utility (`backend/app/services/wind_analysis.py`)
Create a utility that, given a waypoint's travel bearing and the wind direction/speed at that point, computes:
- `headwind_component` (km/h) — positive = headwind, negative = tailwind
- `crosswind_component` (km/h)
- `wind_effect` label: "headwind" | "tailwind" | "crosswind" | "calm"
- `effective_speed_impact` — estimated % speed reduction/gain

### 4. Backend: Extend schemas for route & waypoints
- Add `destination` (optional `RideLocationSchema`) to `RideInputSchema`
- Add new schema `RouteWaypointWeather` with: lat, lon, distance_km, bearing, weather summary, wind analysis
- Add new schema `RouteSegment` with: start/end coords, color code, wind_effect label
- Add to `RideReportSchema`: `routeGeometry` (list of [lat, lon]), `waypoints` (list of `RouteWaypointWeather`), `routeSegments` (for map coloring), `destinationLocation` (optional string)

### 5. Backend: Extend `build_report` to handle destination
In `app/services/recommendations.py`, when `destination` is provided:
1. Geocode destination if no lat/lon
2. Call OSRM routing service to get route geometry
3. Sample waypoints every ~25km
4. Fetch weather for each waypoint (using the ride's estimated arrival time at that point)
5. Compute wind analysis per waypoint
6. Build color-coded route segments
7. Override `distanceKm` with OSRM's calculated distance if the user didn't specify one
8. Include all route data in the report response

### 6. Backend: New API endpoint for routing preview (optional)
Add `GET /api/routing/preview?startLat=...&startLon=...&destLat=...&destLon=...` for the frontend to show a route preview on the map before generating the full report. Returns just geometry + distance + duration. This enables the map to render while the user fills in other fields.

### 7. Frontend: Install shadcn-map + leaflet dependencies
Install shadcn-map component and its peer dependencies (leaflet, react-leaflet). Set up the map component in `src/components/ui/map.tsx`.

### 8. Frontend: Add destination field to RideInput types
- Add `destination?: RideLocation | null` to `RideInput` type
- Add corresponding fields to `RideInputSchema` API payload

### 9. Frontend: Add destination picker to RidePlanner
Add a second `LocationPicker` for the optional destination in `RidePlanner.tsx`. When the destination is set:
- Show an inline route map preview between start and destination (using the routing preview endpoint)
- Calculate and display the route distance (replacing manual distance input)
- The destination field should be clearly optional — collapsed by default, expandable with "+ Add destination" button

### 10. Frontend: Create RouteMap component (`src/components/ride-report/RouteMap.tsx`)
An interactive Leaflet map (via shadcn-map) that displays:
- Start marker (green) and destination marker (red)
- The route polyline, color-coded by headwind/tailwind/crosswind (green = tailwind, red = headwind, yellow = crosswind)
- Waypoint markers with popup showing: weather icon, temp, wind info, headwind component
- A legend explaining the color coding

### 11. Frontend: Create WindAnalysis summary component (`src/components/ride-report/WindAnalysis.tsx`)
A report section showing:
- Overall headwind/tailwind summary for the ride
- Per-waypoint breakdown: distance marker, weather icon, temp, wind direction vs travel direction, headwind component
- Visual indicator (arrow/gauge) showing net wind impact

### 12. Frontend: Integrate RouteMap and WindAnalysis into RideReport
Add the new components to `RideReport.tsx`:
- RouteMap displayed at the top of the report (after the header, before weather chart)
- WindAnalysis section after the weather panel
- Both only render when route data is present (destination was specified)

### 13. Frontend: Update ride-report types
Add to `RideReport` type:
- `routeGeometry?: [number, number][]`
- `waypoints?: RouteWaypointWeather[]`
- `routeSegments?: RouteSegment[]`
- `destinationLocation?: string`

### 14. Frontend: Extend saved routes for destination
- Update `SavedRouteCreate` / `SavedRouteUpdate` schemas to include destination in `ride_input` (already stored as JSONB, so no migration needed)
- Ensure the routes page and shared reports work with the new destination field

### 15. i18n: Add translation keys
Add German and English translation keys for:
- Destination field labels and placeholders
- Wind analysis labels (headwind, tailwind, crosswind, calm)
- Route map legend
- Wind effect severity descriptions

### 16. Tests: Backend tests for new services
- Unit tests for OSRM routing service (mocked HTTP)
- Unit tests for waypoint sampling (bearing calculation, distance sampling)
- Unit tests for wind analysis (headwind/tailwind math)
- Integration test for `build_report` with destination

---

## Dependencies Between Todos

```
1 (OSRM service) → 5 (build_report), 6 (preview endpoint)
2 (waypoint sampling) → 5 (build_report)
3 (wind analysis) → 5 (build_report)
4 (schemas) → 5 (build_report), 13 (FE types)
5 (build_report) → 16 (tests)
7 (install shadcn-map) → 10 (RouteMap), 9 (planner preview)
8 (FE types) → 9 (planner), 10 (RouteMap), 11 (WindAnalysis)
9 (destination picker) → 12 (integration)
10 (RouteMap) → 12 (integration)
11 (WindAnalysis) → 12 (integration)
13 (FE report types) → 10 (RouteMap), 11 (WindAnalysis)
15 (i18n) — can be done in parallel
```

## Notes

- OSRM demo server has usage limits — for production, consider self-hosting OSRM or using a paid service
- Weather waypoint fetching adds N API calls per report (N = route_distance / 25km). Open-Meteo is free but has rate limits. Consider batching requests.
- The SavedRoute model already stores `ride_input` as JSONB, so adding `destination` requires no DB migration
- For multi-day rides with destination, each day stop becomes a segment of the overall route (start→stop1→stop2→...→destination)
- The map should handle mobile responsiveness well — Leaflet + shadcn-map support touch gestures natively
