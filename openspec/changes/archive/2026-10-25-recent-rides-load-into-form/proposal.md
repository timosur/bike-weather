# Proposal

## Why

Clicking a "Recent rides" card currently re-submits the stored ride immediately, using its original date and time. The user gets a report for a stale or past date, cannot adjust anything first, and every click adds a duplicate history entry. The card also shows the old weather condition and the query timestamp, which reads as current information.

## What Changes

- Clicking a recent ride **loads it into the planner form** instead of submitting. The user reviews/edits and submits manually.
- **Date/time smart default:** if the stored ride date/time is in the past, the form is filled with today + current time; a future date/time is kept as-is.
- The planner info banner ("Loaded from ride history") offers a **one-click toggle** between the original date/time and now ("Use original date" ↔ "Use now"). The toggle is only shown when the original date/time differs from now (i.e. was in the past).
- **Deduplication:** when a ride with the same route (start, destination, waypoints) and bike type is submitted again, the older entry is removed and the new one goes to the top.
- **Card content:** shows start → destination, distance, bike type and the last-used date. The stale weather condition badge is removed.
- **Layout:** the 3 most recent rides are visible; "show more" reveals the rest (max 10, unchanged).

## Out of Scope

- Server-side / cross-device ride history (stays in localStorage).
- Changing the history size limit (10) or storage format beyond what dedup needs.
- Renaming, pinning or favouriting history entries (saved routes already cover this).
- Showing a cached report from history without re-fetching.
- Changes to saved routes, "Edit ride" from report, or GPX import flows.

## Capabilities

### New Capabilities
- `ride-history`: Local history of recently planned rides in the planner — what is recorded, how entries are listed, and how selecting an entry pre-fills the planner form including date/time handling.

### Modified Capabilities
_None._

## Impact

- Frontend only: `pages/PlannerPage.tsx` (select handler, form source/banner wiring), `components/ride-planner/RecentRides.tsx` (card + layout), `components/ride-planner/RidePlanner.tsx` (banner toggle), `hooks/useRideHistory.ts` (dedup), `i18n/locales/{de,en}.json`.
- E2E: replace the placeholder recent-rides test in `e2e/ride-planner.spec.ts` with real coverage.
- No backend, API or data migration. Existing localStorage entries remain readable.
