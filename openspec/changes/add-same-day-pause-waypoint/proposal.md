# Proposal

## Why

Cyclists often ride A → B in the morning and B → A in the evening of the same day. Today they must plan two separate rides (using the swap button for the return), and neither report warns that the evening leg needs different clothing. Overnight stops (`sleep` waypoints) already split a tour into separately forecast days. A same-day equivalent is missing.

## What Changes

- New waypoint type **`pause`** next to `stop` and `sleep`: a longer break at a waypoint with a fixed departure time on the **same day**.
- Planner waypoint toggle gets a third option "Pause" with a "Departure at" time input, mirroring the overnight UI.
- A ride with pause and/or sleep waypoints is split into **legs**. Each leg gets its own forecast window, condition, clothing, equipment and tips, as overnight days already do.
- **Along-route weather per leg:** each leg's chart and worst-case summary use only the route points of that leg. Today only day 1 is route-aware, and it uses the whole route.
- **Map arrival times include pauses and overnights:** route segment weather on the map is fetched for the time the rider actually passes, not `start + distance / speed`.
- The merged packing list (already built for multi-day tours) applies to legs, so items needed only for the evening leg are marked with that leg, e.g. "Long-sleeve jersey – … (Leg 2)".
- **Explicit packing tip:** when a later leg needs clothing that leg 1 does not, the report adds a tip such as "Pack long-sleeve jersey – it gets cooler on Leg 2 (feels like 9 °C)".
- Leg tabs are labelled with leg number and start time ("Etappe 2 · 17:00").
- Leg duration is derived from the route distance between split points (start → pause/sleep → … → destination) when no planned distance is given, instead of reusing the full-ride duration for every day. This applies to pause and sleep.
- Validation: a pause's departure time must be later than its leg's start time. A departure earlier than the estimated arrival is accepted with a warning tip.
- Return trip: covered by the existing swap button (BIKE-23); a pause keeps its departure time when waypoints are reversed. No new menu entry.

## Capabilities

### New Capabilities

- `ride-waypoints`: waypoint types (stop, pause, sleep), their inputs in the planner, and validation of pause departure times.
- `ride-legs`: splitting a ride into legs at pause/sleep waypoints, per-leg along-route forecasts and timing, map arrival times, leg labels, the merged packing list and packing tips across legs.

### Modified Capabilities

_None. No existing OpenSpec spec covers waypoints (only `ride-history` exists). The previous behavior is described in `project/features/` (BIKE-1, BIKE-23)._

## Impact

- **Backend:** `app/schemas/ride.py` (`WaypointSchema.type` Literal + validation), `app/services/recommendations.py` (leg-splitting loop, per-leg distance, per-leg route weather, map arrival times, packing/early-departure tips), `app/services/route_waypoints.py` (leg split helper), `app/rules/translations.py` (leg label, tip texts). No API shape change beyond the new enum value; no DB migration (saved routes store input as JSON).
- **Frontend:** `ride-planner/types.ts`, `ride-planner/WaypointList.tsx`, `ride-report/RouteMap.tsx` (pause marker), `i18n/locales/{de,en}.json`.
- **Behavior change for existing overnight tours:** day durations and end times now come from per-leg route distance instead of the total ride duration; days 2+ get along-route weather; map segment colours shift to the actual pass-through date/time. One extra weather call per pause or overnight (the leg's start-location forecast); sample-point calls are not duplicated.
- **Docs:** `project/ARCHITECTURE.md`.
