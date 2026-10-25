# Tasks

## 1. E2E tests first (red)

- [x] 1.1 In `frontend/e2e/ride-planner.spec.ts`, replace the placeholder "recent rides are shown" test with specs that seed `bike-weather:ride-history` via `page.addInitScript`. Cover: select loads the form with no `/report` navigation and no report request, the history banner is visible, a past entry shows today + current time, a future entry keeps its date, "Use original date" ↔ "Use now" toggles while keeping a changed bike type, no toggle appears for future entries, 3 visible + "show more", and no condition badge. Verify the new tests fail against the current code (`npx playwright test e2e/ride-planner.spec.ts`).
- [x] 1.2 Add an E2E test for dedup: submit the same ride twice (using `mockRideReportAPI`) and assert one history entry; submit again with a different bike type and assert two. Verify it fails on the current code.

## 2. History hook: dedup

- [x] 2.1 Add `rideKey()` in `hooks/useRideHistory.ts` and filter equal-key entries in `addEntry` before prepending (design §4). Verify the dedup test from 1.2 passes.

## 3. Date/time helper + planner toggle

- [x] 3.1 Create `src/lib/rideDateTime.ts` with `nowDateTime()` (local `YYYY-MM-DD`, `HH:MM`) and `isPastDateTime(date, time)`. Replace the UTC `today` in `RidePlanner.tsx` with it. Verify with `npm run build`.
- [x] 3.2 Add the optional `historyOriginalDateTime` prop to `RidePlannerProps` (`types.ts`) and render the "Use original date" / "Use now" button in the existing formSource banner (design §2). Add de/en keys `planner.formSource.useOriginalDate` and `planner.formSource.useNow`. Verify the toggle tests from 1.1 pass.

## 4. Planner page: select pre-fills instead of submitting

- [x] 4.1 In `pages/PlannerPage.tsx`, replace `handleHistorySelect` → `doSubmit` with `historyPrefill` state. Apply the smart default, feed `getInitialValues` / `getFormSource` / `historyOriginalDateTime`, include the entry id in the `RidePlanner` key, scroll to top, and clear `historyPrefill` on reset (design §1). Verify the select/prefill tests from 1.1 pass.

## 5. Recent rides card + layout

- [x] 5.1 In `components/ride-planner/RecentRides.tsx`, remove the condition badge and `conditionColors`, show `start → destination`, distance (fallback `rideInput.distanceKm`), bike type label and last-used date, and show 3 entries before "show more" (adjust the `showMore` count). Verify the card/layout tests from 1.1 pass.

## 6. Integration + docs

- [x] 6.1 Run `make test-frontend` and `cd frontend && npm run build`. All tests should pass and the build should succeed with no unused-symbol errors.
- [x] 6.2 Manual check in `make dev`: plan a ride, return to the planner, click the history entry, toggle the date, and submit. The report should show the chosen date, and the history should contain one entry for that ride.
- [x] 6.3 Update the related feature spec / `project/features/INDEX.md` per AGENTS.md (or create a BIKE-X entry if none covers recent rides). Verify by re-reading the edited files.
