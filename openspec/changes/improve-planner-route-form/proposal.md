# Proposal

## Why

With pause and overnight waypoints, the planner form became hard to read. Waypoint times are cut off ("05:00 F"). The start time sits below the map, after the waypoint times, so the form reads out of order. Each waypoint is a tall stack of controls. Nothing shows the plan the report will compute. A same-day return trip, the main use case, needs several manual steps.

## What Changes

- **Fix:** waypoint departure time inputs fit 12-hour (AM/PM) and 24-hour formats without truncation.
- **Layout:** departure date and start time move directly below the start location, so the form reads in time order: start + time → waypoints → destination → map.
- **Compact waypoint rows:** each waypoint is one line, with location, the Stop / Pause / Overnight toggle and a × remove button. Pause and overnight show their departure time inline ("☕ until 17:00", "🛏️ next day 08:00"). The name field is hidden behind an "Add name" link and stays visible once a name is set.
- **Live timeline preview** below the route map: start time, estimated arrival at each split waypoint, its departure, and estimated arrival at the destination. A pause departing before the estimated arrival is highlighted.
- **"Back to start" shortcut** next to the destination. One click turns the current destination into a Pause waypoint, sets the destination to the start location, and pre-fills the departure with estimated arrival + 1 h (rounded up to 15 min). The departure input gets focus.
- The swap button moves next to the destination row so it clearly swaps start and destination.

## Capabilities

### New Capabilities

- `ride-planner-form`: layout and input behavior of the ride planner route section: field order, waypoint rows, timeline preview, and the back-to-start shortcut.

### Modified Capabilities

_None._ The waypoint types and their validation stay as defined in `ride-waypoints` (change `add-same-day-pause-waypoint`, not yet archived); this change only alters how they are entered.

## Out of Scope

- Backend or API changes. The timeline is a client-side estimate; the report stays authoritative.
- Waypoint drag-and-drop reordering.
- A "nights" count for overnight stays (multi-day stays).
- Changes to bike type, intensity and advanced-options sections.
- Saved-route or recent-rides behavior.
- GPX import flow beyond showing the timeline for imported geometry.

## Impact

- **Frontend:** `ride-planner/RidePlanner.tsx` (section order, swap placement, timeline, back-to-start), `ride-planner/WaypointList.tsx` (compact rows), a new small `RideTimelinePreview` component, a pure `lib/rideLegs.ts` (leg split and timing estimate, mirroring backend `ride_legs`), `i18n/locales/{de,en}.json`.
- **E2E:** `e2e/helpers/planner.ts` locators may need updating after the layout change; existing planner and pause specs must keep passing.
- **Backend:** none.
