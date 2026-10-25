# Tasks

## 1. Leg estimate module

- [ ] 1.1 Add Vitest as a dev dependency with `npm run test:unit` (`vitest run`) and a Makefile target `test-frontend-unit`. Verify `npm run test:unit` runs (no tests yet is OK) and `npm run build` still succeeds.
- [ ] 1.2 Write failing Vitest tests in `frontend/src/lib/rideLegs.test.ts`, mirroring the backend `test_route_legs.py` / `test_ride_legs.py` cases: straight line with one split, out-and-back gives two equal legs, a location revisited, an off-route split, a pause/sleep/pause date mix, sleep default 08:00, `plannedKm` override, no geometry fallback. Then implement `frontend/src/lib/rideLegs.ts` (`splitRouteKm`, `buildLegs`) (design D1). Verify `npm run test:unit` passes.

## 2. Layout and readability

- [ ] 2.1 Add e2e assertions in `e2e/pause-waypoint.spec.ts`: the date/time inputs come before the first waypoint in the DOM; a pause departure at 17:00 in English is fully visible (input `scrollWidth <= clientWidth`) at desktop and 390 px. Verify they fail.
- [ ] 2.2 Move the date/time block below the start location, and the swap button into the destination row (design D3). Widen the departure input (D4). Verify 2.1 passes and `e2e/ride-planner.spec.ts` still passes.

## 3. Compact waypoint rows

- [ ] 3.1 Update `e2e/pause-waypoint.spec.ts` for the compact row: the departure input is in the same row as the toggle; "Add name" reveals the name input; a loaded waypoint with a name shows the input; the × button (aria-label "Remove waypoint") removes the row. Verify the new assertions fail.
- [ ] 3.2 Rebuild `WaypointList.tsx` rows as one line with inline departure, an "Add name" toggle and an × remove (D4). Add i18n keys (`waypoints.addName`, `waypoints.until`, `waypoints.nextDay`) in DE + EN and remove unused ones. Verify 3.1 and all existing pause/planner e2e specs pass, and the build succeeds.

## 4. Timeline preview

- [ ] 4.1 Write failing e2e tests: the same-day return shows `09:00` start, `~10:00` arrival at B, "until 17:00", `~18:00` at the destination (route preview mocked so that each half is ~60 min); an overnight shows "next day 08:00"; a pause departing before arrival is highlighted; no timeline without a destination.
- [ ] 4.2 Implement `RideTimelinePreview.tsx` using `buildLegs` and render it below the map in `RidePlanner` (D5), with i18n DE + EN. Verify 4.1 passes and the build succeeds.

## 5. Back to start

- [ ] 5.1 Write failing e2e tests: with A → B, "Back to start" makes B a pause and the destination A, with the departure prefilled to arrival + 1 h rounded up to 15 min and the time input focused; it isn't offered when the destination equals the start; it prefills 17:00 when there's no route preview. Add Vitest cases for the rounding helper (10:20 → 11:30, midnight clamp → 23:45).
- [ ] 5.2 Implement the back-to-start handler, button and `focusIndex` prop (D6) with i18n DE + EN. Verify 5.1 and the unit tests pass.

## 6. Integration and docs

- [ ] 6.1 Run `npm run test:unit`, `npm run build` and the full Playwright suite; confirm no new failures versus the known 8 pre-existing ones (admin, flows, my-routes, ride-report). Screenshot the planner at desktop and 390 px and check the form reads top to bottom in time order.
- [ ] 6.2 Update `project/ARCHITECTURE.md` (frontend: `lib/rideLegs.ts` mirrors the backend leg rules; Vitest unit tests) and the AGENTS.md testing commands (`npm run test:unit`). Re-read both files to verify.

## Workflow follow-up

- Archive after review together with or after `add-same-day-pause-waypoint`, so `ride-planner-form` and `ride-waypoints` land in `openspec/specs/` consistently.
