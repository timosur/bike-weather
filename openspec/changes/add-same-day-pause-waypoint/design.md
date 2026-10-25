# Design

## Context

- `WaypointSchema` (`backend/app/schemas/ride.py`) has `type: Literal["stop", "sleep"]`, `startTime`, `plannedKm`.
- `build_report` (`backend/app/services/recommendations.py`) runs in this order:
  1. Routing, then **map route weather** (~L470–520). Each sample point is fetched at `start + distance_from_start / speed`, where speed is `averageSpeedKmh or 20`. Pauses and overnights are ignored.
  2. `route_sample_points` (~L603) along the whole route.
  3. Day list (~L644–700). Entry 0 is the start. Each `sleep` adds an entry dated `start_date + i + 1`. Days without `plannedKm` reuse the **total** ride duration.
  4. Per-day loop. Only day 0 uses route weather: `_collect_route_ride_hours` takes the worst case over **all** route points, and `_build_route_chart_hours` uses the **total** distance. Later days use the weather at their start location.
  5. `_merge_{clothing,equipment,tips}_across_days` add "(Day n)" to partial items. Tips are deduplicated by `id`.
- The frontend report (`DayTabs`, `DayTimeline`, `MultiDayWeatherChart`) renders `report.days[]` by `dayLabel`. It does not assume one date per entry.
- Saved routes store `RideInput` as JSON, so a new enum value needs no migration.

## Goals / Non-Goals

**Goals:**
- One leg model (distance range, date, start time, duration). Durations, route weather, map arrival times and tips all derive from it.
- Reuse the existing multi-day pipeline; no parallel code path.
- No extra weather calls for same-day pauses.

**Non-Goals:**
- A separate "plan return trip" menu action. The swap button covers it.
- New report UI components. Existing day tabs show legs, and tips render through the existing tip list.
- Pause support in the GPX importer.

## Decisions

### D1: `pause` is a third waypoint type, not a flag on `stop`
Extend the Literal to `"stop" | "pause" | "sleep"` (backend and frontend `WaypointType`). It mirrors `sleep` (has `startTime`) except for the date offset, and keeps the planner toggle a single control.
*Alternative:* `stop` + optional `departureTime`. Rejected: ambiguous (is a stop with a time a split?) and adds a second input path.

### D2: Build legs once, right after routing
Add a `Leg` dataclass in a new module `app/services/ride_legs.py` (`start_km`, `end_km`, `date`, `start_time`, `duration_min`, `location`, `split_waypoint`), with `build_legs`, `leg_for_km` and `leg_time_at`. Build the list **before** the map weather fetch, because the map arrival times need it:
- Split waypoints = waypoints with type `pause` or `sleep`, in order.
- `leg_date` advances one day only after `sleep`. `start_time` = ride `startTime`, then each split's `startTime` (sleep default `08:00`).
- Duration = `resolve_duration_minutes` from `plannedKm`; else the resolved total duration × leg km / total km (D3); else the total duration (no geometry).
- Pace for map times and charts = leg km / leg duration, so map, chart and leg end times agree. The map's separate `averageSpeedKmh or 20` fallback is removed. The displayed average speed is unchanged.

`day_locations` / `day_durations` / `day_start_times` are replaced by iterating `legs`. `is_multi_day` becomes `len(legs) > 1`. The wind-exposure lookup uses the leg's km.

### D3: Leg distance from route geometry
Add a helper in `route_waypoints.py`: `split_route_km(geometry, split_points) -> list[float]` gives cumulative km at each split. Each split snaps to the nearest geometry index, searching **forward** from the previous split's index, so A → B → A does not snap the return to the outbound half. Leg km = difference of consecutive values, clamped to ≥ 0.
*Alternative:* per-leg OSRM requests. Rejected: extra network calls for data the geometry already holds.

### D4: Validation in the schema
A `model_validator(mode="after")` on `RideInputSchema` walks the waypoints with a current leg start (ride `startTime`, then each `sleep`'s `startTime` or `08:00`). For a `pause` it requires `startTime` matching `HH:MM` and greater than the current leg start, then sets the leg start to the pause's time. It raises `ValueError` naming the waypoint (name or 1-based index), which FastAPI returns as 422. It runs after the existing `dayStops` migration validator. Arrival time is **not** checked here: it depends on route distance, which the schema does not know (see D9).

### D5: Labels
In `app/rules/translations.py` add `DAY_LABELS["leg"] = {"de": "Etappe {n} · {time}", "en": "Leg {n} · {time}"}`. Use it when any waypoint is a `pause`, otherwise keep `"day"`. The merged-list notes then read "(Etappe 2 · 17:00)" with no further change.

### D6: Along-route weather per leg
- Sample points come from `sample_weather_points` (unchanged). Assign each to the leg whose `[start_km, end_km)` contains its `distance_from_start_km`; the last point goes to the last leg.
- Fetch a full-day window per point for its own leg's date. No extra cache: each point is fetched once, and `WeatherService` already caches by key. The leg's start-location window is prepended as its km-0 point, so the chart is right at departure (e.g. at B for the evening leg). Net cost: **one** extra call per split (the start-location forecast); sample-point calls don't increase, even for overnights.
- Per leg, call the existing `_collect_route_ride_hours` with only that leg's points. Call `_build_route_chart_hours` with those points, distances rebased by `- leg.start_km`, and `leg_km` as the total distance. Both helpers stay as they are.
- A leg with no sample points (very short leg) still has its start-location point.
- Equipment rules and tips get the leg's start time, distance and duration (previously the ride's start time and total values for every day).
- The past-midnight extension (`chart_end > 23`) keeps using the leg's last point.

### D7: Map arrival times from legs
Replace `start_dt + distance / speed` with `leg_time_at(km)`: find the leg containing `km`, then `datetime(leg.date, leg.start_time) + (km - leg.start_km) / avg_speed`. The fetch uses that date and hour. `segmentDurationMinutes` is unchanged.

### D8: Packing tip
After the per-leg loop, for each leg n ≥ 2: `extra = [c for c in leg_n.clothing if c.id not in leg1_ids]`. If `extra` is not empty, append a `TipSchema(id=f"pack-leg-{n}", category="comfort", severity="info", message=...)` to `merged_tips`, **after** `_merge_tips_across_days` so it gets no second suffix. Message template in `translations.py`:
- DE: "Pack noch {items} ein – auf {leg} wird es kühler (gefühlt {temp} °C)."
- EN: "Pack {items} – it gets cooler on {leg} (feels like {temp} °C)."

`items` = the item names joined; `temp` = that leg's `temp_feels_like`.

### D9: Early-departure warning
While building legs (D2), for each `pause` compute the estimated arrival = previous leg start + previous leg duration. If the departure is earlier, add `TipSchema(id=f"early-departure-{i}", category="safety", severity="warning", message=...)` naming the waypoint (name/address) and the arrival `HH:MM`. Add it to `merged_tips` in the same way as D8. The leg still starts at the given departure time.

### D10: Frontend
- `WaypointList.handleTypeChange`: `startTime` = existing value or default per type (`sleep` → `08:00`, `pause` → `17:00`); `stop` → `undefined`.
- Third toggle button "☕ Pause" (amber accent). The time box reuses the overnight markup with the label `waypoints.departureSameDay`. Extract a shared component only if the JSX would otherwise be duplicated verbatim.
- `RouteMap`: pause marker/label. Swap needs no change (`.reverse()` keeps waypoint objects intact).

## Risks / Trade-offs

- [Overnight tours change: per-leg durations, along-route weather for days 2+, shifted map colours] → Intended fixes. Existing multi-day tests are updated to the new expectations; the CHANGELOG entry at release calls it out.
- [More weather calls for overnight tours (points × extra dates)] → Bounded by `sample_weather_points` count; the existing `Semaphore(5)` and the per-(point, date) cache keep it in check. No change for single-day rides or pauses.
- [Map speed now uses the resolved bike/intensity speed instead of a flat 20 km/h fallback] → Map and charts become consistent; map colours may shift slightly for existing reports.
- [Nearest-point snapping picks the wrong spot on loops that pass a waypoint twice] → Forward-only search from the previous split index; clamp ≥ 0 km.
- [Leg crossing midnight after a late pause] → Same clamping and next-day extension as single-day rides.
- [`build_report` grows further] → The leg list replaces three parallel lists, and the helpers (D3, `leg_time_at`, tips) are small functions with their own unit tests.

## Migration Plan

No DB migration. Old clients never send `pause`. Rollback = revert. Saved routes containing `pause` would then fail validation on re-submit, which is acceptable for a revert.
