# BIKE-23: Reverse Route Direction

| Field            | Value                                                        |
| ---------------- | ------------------------------------------------------------ |
| **ID**           | BIKE-23                                                      |
| **Status**       | Deployed                                                     |
| **Created**      | 2026-03-17                                                   |
| **Dependencies** | BIKE-1 (Ride Planning), BIKE-3 (GPX Import), BIKE-5 (Routes) |

## Description

A swap button in the ride planner that reverses the route direction — start becomes destination, destination becomes start, and all waypoints are reversed in order. This lets cyclists quickly plan the return trip on the same route without re-entering locations manually. When imported GPX geometry is present, the geometry is also reversed so the track runs in the opposite direction.

## Scope

- **Frontend only** — no backend or API changes required; the swap is a client-side form transformation
- Swap button in the ride planner between the start location and destination pickers
- Reverses: start location, destination, waypoint order, and imported GPX geometry
- Triggers a new route preview fetch after swapping (unless imported geometry is present)
- Button always visible, disabled when start or destination is missing
- i18n labels for DE + EN

### Key Files (expected)

- `frontend/src/components/ride-planner/RidePlanner.tsx` — swap button + handler logic
- `frontend/src/i18n/locales/en.json` — new i18n key for swap tooltip
- `frontend/src/i18n/locales/de.json` — new i18n key for swap tooltip

## User Stories

- **US-1**: As a cyclist planning a ride, I want to swap start and destination with one tap so that I can quickly plan the return trip without re-entering locations.
- **US-2**: As a cyclist who imported a GPX track, I want to reverse the route direction so that I can ride the same track in the opposite direction with accurate weather along the reversed route.
- **US-3**: As a cyclist with waypoints on a multi-day tour, I want the waypoints to reverse order when I swap the route so that the intermediate stops remain in the correct sequence for the return trip.
- **US-4**: As a cyclist with a saved route, I want to swap the direction after loading a saved route into the planner so that I can check weather for both directions.

## Acceptance Criteria

- [ ] AC-1: A swap/reverse button is visible in the planner between the start location and destination pickers
- [ ] AC-2: The button is disabled (grayed out) when either start or destination is missing
- [ ] AC-3: Clicking the button swaps the start location and destination values (address, lat, lon)
- [ ] AC-4: Clicking the button reverses the order of all waypoints (including overnight stays)
- [ ] AC-5: When imported GPX geometry (`importedGeometry`) is present, clicking the button reverses the geometry array
- [ ] AC-6: After swapping, a new route preview is fetched (via the existing preview effect) unless imported geometry is present
- [ ] AC-7: The swap button has an accessible tooltip/aria-label in both DE and EN
- [ ] AC-8: The swap action marks the form as dirty (triggers unsaved-changes detection if applicable)

## Edge Cases

- **EC-1: Only start set, no destination** — Button is disabled; no action taken.
- **EC-2: Destination set, no start** — Button is disabled; no action taken.
- **EC-3: No waypoints** — Swap only affects start and destination; no waypoint logic runs.
- **EC-4: Waypoints with missing coordinates** — Waypoints without lat/lon are still reversed in order (they remain incomplete but in the correct sequence).
- **EC-5: GPX geometry with waypoints** — Both the geometry array and waypoint list are reversed.
- **EC-6: Round-trip (start = destination)** — Swap still executes but result is identical; no special handling needed.
- **EC-7: Route preview loading** — If a preview fetch is in progress when swap is clicked, the swap still applies; the existing effect will cancel/replace the in-flight request.

---

<!-- Appended by /architecture agent -->

## Tech Design

### Service Impact Map

```
Frontend: 1 modified component + 2 i18n files
Backend:  No changes
Agent:    No changes
Database: No changes
```

This is a **frontend-only** feature. The swap is a client-side form state transformation — no new API endpoints, models, or migrations are needed.

### Component Structure

The swap button is placed inside the existing `RidePlanner` component, between the start location picker and the waypoint list. It uses a vertical swap icon (`ArrowUpDown` from lucide-react, already available in the project) centered on a subtle divider line.

```
RidePlanner (modified)
├── LocationPicker (start)
├── 🔄 SwapDirectionButton ← NEW (inline, not a separate component)
├── WaypointList
├── LocationPicker (destination)
├── RouteMap (preview)
└── ... rest of form
```

The button is **not** a separate component file — it's a small inline element (icon button + divider) added directly in `RidePlanner.tsx` to avoid unnecessary abstractions.

### Swap Handler Logic

When the swap button is clicked, a single `setForm()` call updates the form state atomically:

1. **Swap locations** — `form.location` ↔ `form.destination`
2. **Reverse waypoints** — `form.waypoints` array is reversed (`.slice().reverse()`)
3. **Reverse GPX geometry** — if `form.importedGeometry` is present, the array is reversed (`.slice().reverse()`); when reversed, the `routePreview` is also updated in-place with the reversed geometry
4. **Clear distance** — `form.distanceKm` is reset to `null` so the route preview effect recalculates it (for OSRM routes) or so it gets recalculated from reversed geometry

**Route preview re-fetch** happens automatically because the existing `useEffect` watches `form.location` and `form.destination` coordinates. When those change (via the swap), a new OSRM preview is fetched. For imported geometry, the effect is skipped (existing behavior) and the preview is updated directly from the reversed geometry.

**Dirty state** is triggered automatically because the handler calls `markDirty()` before the state update.

### Button Placement & Styling

The button sits between the start location section and the waypoints section, rendered as:
- A centered circular icon button on a horizontal divider line
- Uses the `ArrowUpDown` icon (16×16, stone color, emerald on hover)
- Disabled state: reduced opacity, no pointer events
- Tooltip via `title` attribute with i18n text

### i18n Keys

Two new keys added to the `planner` namespace:

| Key                     | EN                           | DE                        |
| ----------------------- | ---------------------------- | ------------------------- |
| `planner.swapDirection` | "Swap start and destination" | "Start und Ziel tauschen" |

### Dependencies

No new packages. `ArrowUpDown` is available from `lucide-react` (already installed).

### What Stays Unchanged

- `RidePlannerProps` interface — no new props needed (swap is internal to the component)
- `RideInput` type — no schema changes
- Backend API — no endpoint changes
- `LocationPicker` — no modifications
- `WaypointList` — no modifications

## Implementation Plan

_See `project/plans/BIKE-23-plan.md` (created by the Solution Architect agent)._

<!-- Appended by /qa agent -->

## QA Results

_To be filled by the QA agent._
