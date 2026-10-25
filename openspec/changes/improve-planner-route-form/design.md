# Design

## Context

- `RidePlanner.tsx` (~820 lines) renders: start `LocationPicker` → swap button → `WaypointList` → destination `LocationPicker` → GPX link → `RouteMap` preview → date/time → bike type → intensity → advanced options (distance, elevation, speed, duration).
- `routePreview` (`{ distanceKm, durationMinutes, geometry }`) comes from `POST /api/rides/preview` (OSRM, no per-leg distances) or from imported GPX geometry.
- `form.durationMinutes` is auto-estimated in the planner from distance and speed (rounded up to 15 min), unless set manually.
- Backend `app/services/ride_legs.py` splits legs at pause/sleep by route distance (`split_route_km`) and gives each leg `total duration × leg km / total km`.
- `WaypointList.tsx` time input is `w-[110px]`; the English AM/PM value doesn't fit.

## Goals / Non-Goals

**Goals:**
- The preview timeline matches what the report computes for the same input, within rounding.
- No new requests and no backend change.

**Non-Goals:**
- Exact parity with backend rounding to the minute. The timeline shows "~" times.
- Reworking sections below the route (bike type, intensity, advanced).

## Decisions

### D1: Client-side leg estimate in `lib/rideLegs.ts`
A pure module with `splitRouteKm(geometry, splitPoints)` (same snapping as backend: forward search, revisit handling, 0.5 km tolerance), `buildLegs(...)` and `addMinutes`. It is ported from `ride_legs.py` / `route_waypoints.py` and covered by Vitest unit tests (D2).
*Alternative:* return leg distances from `/rides/preview` (OSRM `legs[]`). Rejected for now: needs a backend change, doesn't cover imported GPX, and still needs grouping by split waypoints client-side.
*Alternative:* a backend "timeline" endpoint using `build_legs`. Rejected: a request per keystroke on times/speed for an estimate.
Trade-off: two implementations of the same rule. The backend stays authoritative. The TS module has a header comment pointing at the Python source.

### D2: Test runner for the pure module
The frontend has no unit test runner, only Playwright. Add **Vitest** (confirmed with the user) as a dev dependency with a single `npm run test:unit` script. It's the standard for Vite projects and needs no config beyond `vitest` in `package.json`. That's preferable to testing leg maths through the UI.
*Alternative:* cover via Playwright only. Rejected: snapping edge cases are slow and brittle to reach through the UI.

### D3: Layout
Move the existing date/time block to below the start `LocationPicker`. Move the swap button into the destination label row (right-aligned icon button, same handler and aria-label). No component split beyond the new `RideTimelinePreview`.

### D4: Compact rows in `WaypointList`
- Two lines, because the form card is ~430 px wide even on desktop: `[icon] [LocationPicker compact, flex-1] [×]`, then `[type toggle] [inline departure] [+ Add name | name input]` (`flex-wrap`).
- The pause/overnight departure is inline after the toggle: prefix text ("until" / "next day") + time input. Its width is `w-[7.5rem]` (fits "05:00 PM" plus the icon), and the native picker icon is kept.
- The colored panels and the "Overnight stay" divider are removed. A colored left border shows the type (emerald/amber/indigo).
- Name: no extra state. "Add name" sets `name: ''`, and the input shows whenever `name !== undefined`, so clearing the text keeps it open and loaded names show it. `autoFocus` only when `name === ''`.
- The waypoint search placeholder uses "city or address" instead of "Waypoint name", to avoid two fields with the same label.

### D5: `RideTimelinePreview`
Props: `legs` from `buildLegs`, `waypoints`, start label and destination label. It renders an ordered list:
- `09:00 A`
- `~10:00 B` + `☕ until 17:00` (or `🛏️ next day 08:00`)
- …
- `~18:00 A`

Early departure (`leg.startDt < prev.endDt`) gets an amber row with a warning icon and text. It's hidden when `routePreview` or start/destination is missing. It re-renders from form state; no effect or fetch.

### D6: Back to start
The handler lives in `RidePlanner`, next to the swap handler:
1. Arrival = `buildLegs(...)` last leg end. Without a preview: `null`.
2. Departure = arrival ? `ceil15(arrival + 60 min)` : `17:00`. If that crosses midnight, clamp to `23:45`.
3. `setForm`: append `{ location: destination, type: 'pause', startTime }`, set `destination = location`, mark dirty.
4. Focus: `WaypointList` takes an optional `focusIndex` prop and focuses that row's time input after render.

It also resets `distanceKm` and doubles a manually set `durationMinutes`, since that described the way there; an auto-estimated duration follows the new preview distance. It's shown only when both are set, differ by more than 0.5 km (haversine), and no GPX track is imported. The existing preview effect refetches the route because the destination and waypoints changed.

## Risks / Trade-offs

- [TS and Python leg logic drift apart] → Keep the rules identical and small. The unit tests mirror the backend's `test_route_legs.py` cases. A header comment names the Python source.
- [The preview estimate differs from the report, e.g. the backend speed table vs a manual duration] → Both use `form.durationMinutes` split by km. The "~" marking and the report remain the truth.
- [The layout change breaks e2e locators in `helpers/planner.ts`] → Selectors are role/placeholder-based, and the button labels stay the same. Run the full planner specs; update only helpers if needed.
- [Adding Vitest adds a dependency] → Dev-only, one script, no config file.
