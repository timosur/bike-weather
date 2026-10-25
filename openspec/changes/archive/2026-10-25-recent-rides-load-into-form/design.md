# Design

## Context

- History lives in localStorage (`bike-weather:ride-history`) via `hooks/useRideHistory.ts`. Entries are written by `ReportPage.doFetch` for new rides only.
- `PlannerPage.handleHistorySelect` calls `doSubmit(entry.rideInput)`, which navigates to `/report` (cause of the stale-date report and the duplicates, since a non-edit submit records history again).
- `RidePlanner` keeps all form values in internal `useState`, seeded once from `initialValues`. `PlannerPage` forces a reseed by changing the component `key`.
- `RidePlanner` already renders a dismissible `formSource` banner; `formSource = 'history'` and the de/en string "Loaded from ride history" exist.
- No frontend unit-test runner exists; only Playwright E2E.

## Goals / Non-Goals

**Goals:**
- Keep edits the user made in the form when toggling date/time.
- Stay backward compatible with existing localStorage entries.

**Non-Goals:**
- Introducing a unit-test runner (Vitest) for this change.
- Refactoring `RidePlanner` into a controlled component.

## Decisions

### 1. Select = remount planner with prefilled values
`PlannerPage` stores the selected entry in state (`historyPrefill: { id, input, originalDate, originalTime } | null`). `getInitialValues()` returns `historyPrefill.input` (with the smart-default date/time applied), `getFormSource()` returns `'history'`, and the `RidePlanner` key includes the entry id so the form reseeds even if the planner is already showing. The page scrolls to the top so the user sees the loaded form.
*Alternative:* navigate with router `prefillInput` state (already supported). Rejected because the toggle needs the original date/time, and router state gets cleared or stays stale on reload.

### 2. Toggle lives inside `RidePlanner`
New optional prop `historyOriginalDateTime?: { startDate: string; startTime: string }`. It is passed only when the smart default replaced a past date/time. The banner then renders a "Use original date" / "Use now" button that does `setForm(f => ({ ...f, startDate, startTime }))`, so other edits stay. Which option is active is derived by comparing `form.startDate/startTime` to the original.
*Alternative:* toggle in `PlannerPage` and remount. Rejected because remounting drops the user's edits (spec: "Edits survive the toggle").

### 3. "Past" check and "now" use local time
`isPast = new Date(`${startDate}T${startTime}`) < new Date()` (parsed as local time). "Now" is the local `YYYY-MM-DD` date plus `HH:MM`. Put this in a small pure helper (`lib/rideDateTime.ts`, the existing helper folder) that `PlannerPage` (smart default) and `RidePlanner` (Use now) both use.
Note: `RidePlanner` currently computes `today` via `toISOString()` (UTC), which is wrong between 00:00 and the UTC offset. Switch it to the same helper. The GPX import handler in `PlannerPage` also uses it now, replacing its inline UTC date.

### 4. Dedup key in `addEntry`
`rideKey(input) = JSON.stringify([loc(input.location), loc(input.destination), input.waypoints.map(w => [loc(w.location), w.type]), input.bikeType])`, where `loc` uses `lat,lon` when present, otherwise `address`. `addEntry` filters out entries with an equal key before prepending. Old entries are compared the same way, so no migration is needed.
*Alternative:* hash with intensity/date included. Rejected because date always differs, so nothing would ever be deduped.

### 5. Card and layout
`RecentRides` drops `conditionColors` and the badge. It shows `start → destination` (destination is omitted if null), distance from `report.totalDistance` (falls back to `rideInput.distanceKm`), bike type label, and `timestamp` as last used. The visible slice changes from 1 to 3. `report` stays in the stored entry for distance/start label. No storage format change.

## Risks / Trade-offs

- [The user picks "Use original date" for a past date and submits] → the date input's existing `min={today}` triggers native browser validation, which blocks the submit. Acceptable: the original date stays visible for reference, and one click on "Use now" fixes it.
- [The date stays at "now" after a long idle time on the page] → this is the same behaviour as a fresh form. Not addressed.
- [Dedup by coordinates misses the same place geocoded slightly differently] → the result is a duplicate entry, the same as today. Low impact.

## Migration Plan

Frontend-only deploy. Existing entries keep working (the badge data is simply ignored). Rollback means redeploying the previous frontend.

## Implementation Notes

- Selection follows the GPX-import pattern: `historyPrefill` takes precedence over `resetKey`, edit mode is cleared, and the form remounts via `resetKey` bump, so selecting the same entry twice reloads it as well.
- Bike-type buttons got `aria-pressed`, and recent-ride cards are `role="button"` with Enter/Space handling (accessibility, and stable E2E selectors).
