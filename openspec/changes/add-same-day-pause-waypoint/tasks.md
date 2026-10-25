# Tasks

## 1. Backend: schema and validation

- [x] 1.1 Write failing tests in `backend/tests/test_api/test_rides.py`: pause accepted, unknown type → 422, pause without/malformed `startTime` → 422, pause before leg start → 422, two ordered pauses accepted, pause after sleep accepted. Verify they fail (`cd backend && uv run pytest tests/test_api/test_rides.py`).
- [x] 1.2 Extend `WaypointSchema.type` to `Literal["stop", "pause", "sleep"]` and add the leg-start `model_validator` on `RideInputSchema` (design D4). Verify 1.1 passes.

## 2. Backend: leg model

- [x] 2.1 Write failing unit tests for `split_route_km` in `backend/tests/test_services/` (straight line with one split; out-and-back A → B → A gives two equal legs; no splits; split off-route snaps forward). Implement it in `app/services/route_waypoints.py` (D3). Verify tests pass.
- [x] 2.2 Write failing unit tests for leg building and `leg_time_at` (dates for pause/sleep mixes, start times, duration from `plannedKm` vs leg km vs fallback, time at a km on leg 2 is after the pause departure). Implement the `Leg` dataclass, the builder, and `leg_time_at` (D2, D7). Verify tests pass. _(Implemented in new module `app/services/ride_legs.py`; leg duration without `plannedKm` = total duration split proportionally by leg km.)_

## 3. Backend: report on legs

- [x] 3.1 Write failing tests in `backend/tests/test_services/test_recommendations.py`: return trip with pause gives 2 same-date entries starting `09:00`/`17:00`, labelled "Leg 1 · 09:00"/"Leg 2 · 17:00"; pause+sleep+pause dates; sleep-only keeps "Day n"; leg durations follow leg distance; merged clothing notes the leg for a leg-only item. Verify they fail.
- [x] 3.2 Replace `day_locations`/`day_durations`/`day_start_times` in `build_report` with the leg list, unify `avg_speed`, add `DAY_LABELS["leg"]` (D2, D5). Verify 3.1 passes; update existing multi-day assertions that relied on total-duration days. _(No existing assertions needed changes. Map/chart pace = leg km / leg duration; display speed unchanged. Equipment and tips now get the leg's start time, distance and duration.)_
- [x] 3.3 Write failing tests: leg 1 condition ignores a rainy point on the return half; leg 2 chart at `17:00` uses a point near B and later hours points near A; same-day pause adds at most one weather call; map sample point on the return half is fetched for an hour ≥ 17. Implement per-leg route weather and leg-based map arrival times (D6, D7). Verify tests pass. _(No separate cache needed: each sample point is fetched once for its own leg's date, and WeatherService already caches by key. Each leg's start-location forecast is used as its km-0 route point, so a pause costs one call at the pause location.)_
- [x] 3.4 Write failing tests: packing tip appears once for leg 2 naming the extra item, leg label and felt-like temp (DE + EN); no tip when later legs need nothing new; early-departure warning names the waypoint and estimated arrival; no warning when departure is after arrival. Implement both tips and their translations (D8, D9). Verify tests pass and `make test-backend` is green. _(All new tests pass. The 10 failures that predate this change (faq, seed, contact, geocoding, safety rules, `test_report_endpoint_returns_valid_report`) remain. The packing tip says "cooler" only when the later leg feels colder; otherwise it uses a neutral "Pack X for leg" text.)_

## 4. Frontend: planner and report

- [x] 4.1 Write a failing Playwright spec in `frontend/e2e/` (reuse `fillBasicRide`/`submitPlannerForm`/`mockMultiDayRideReportAPI`): add waypoint → select Pause → time input shows `17:00` → submitted payload has `type: "pause"`, `startTime: "17:00"`; switching back to Stop drops `startTime`; swap keeps the pause on its waypoint; the report shows two leg tabs with the mocked labels. _(`e2e/pause-waypoint.spec.ts`; uses its own capturing mock built from `mockMultiDayRideReport()`.)_
- [x] 4.2 Add `'pause'` to `WaypointType`, the third toggle and same-day time input in `WaypointList.tsx`, and the per-type default in `handleTypeChange` (D10). Add i18n keys `waypoints.waypointPause` and `waypoints.departureSameDay` (DE+EN), and update `planner.tooltip.waypoints` to mention pauses. Verify 4.1 passes and `cd frontend && npm run build` succeeds. _(Both pass. The full e2e suite shows 112 passed, 8 failed; the same 8 (admin, flows, my-routes, ride-report) also fail on the base commit.)_
- [x] 4.3 Add the pause marker/label to `ride-report/RouteMap.tsx`, then check in `make dev` that a pause waypoint renders on the report map with its label. _(Popup labels are now translated for all waypoint types. Checked with the e2e test "report map labels a pause waypoint" instead of `make dev`.)_

## 5. Integration and docs

- [x] 5.1 Manual check in `make dev`: plan A → B (pause 17:00) → A for tomorrow. Confirm two leg tabs on the same date, the evening chart following the return route, return-half map colours reflecting evening weather, and the packing tip if the evening is cooler. Also confirm an existing overnight saved route still loads and reports. _(Partly done: not run in `make dev` (Postgres/Authentik stack). Instead, a backend smoke test against the real Open-Meteo API for Konstanz → Friedrichshafen (pause 18:00) → Konstanz on 2026-10-26 gave 2 same-date legs ("Etappe 1 · 09:00", "Etappe 2 · 18:00") and a return-half map point fetched for the evening; no packing tip, because both legs needed the same clothing. UI parts are covered by `e2e/pause-waypoint.spec.ts`; legacy overnight input by `test_schema_backward_compat_day_stops_to_waypoints`. A real saved overnight route was not loaded.)_
- [x] 5.2 Update `project/ARCHITECTURE.md` (waypoint types, leg model, per-leg route weather). Re-read the file to verify. _(Feature tracking now lives in OpenSpec only; no `project/features/` entry.)_

## 6. Review fixes

- [x] 6.1 Weather Timeline showed 06–22 for each same-day leg (the date repeated). Write failing tests (same-day legs form one continuous 06–22 timeline; overnight days keep 06–22) and split the window per date at the pause midpoint (`_leg_chart_windows`). Verify tests pass. _(Real-forecast smoke: leg 1 06–14, leg 2 15–22.)_

## Workflow follow-up

- Run `/opsx:archive` after review to merge `ride-waypoints` and `ride-legs` into `openspec/specs/`.
- Mention the overnight-tour behavior change in the release CHANGELOG entry.
