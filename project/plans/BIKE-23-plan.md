# Plan: BIKE-23 — Reverse Route Direction

> Status: Not Started
> Feature spec: [BIKE-23](../features/BIKE-23-reverse-route.md)
> Created: 2026-03-17

## Phase 1: Frontend — Swap Button & Handler

**Owner: Frontend Developer**

- [ ] Add `ArrowUpDown` to the lucide-react imports in `RidePlanner.tsx`
- [ ] Add `handleSwapDirection` handler in `RidePlanner.tsx` that atomically swaps `form.location` ↔ `form.destination`, reverses `form.waypoints`, reverses `form.importedGeometry` (if present), updates `routePreview` for reversed geometry, resets `form.distanceKm` to `null`, and calls `markDirty()`
- [ ] Add the swap button UI between the start location section and the waypoints section in `RidePlanner.tsx` — a centered icon button on a horizontal divider, disabled when `!form.location || !form.destination`
- [ ] Add i18n key `planner.swapDirection` to `frontend/src/i18n/locales/en.json` ("Swap start and destination")
- [ ] Add i18n key `planner.swapDirection` to `frontend/src/i18n/locales/de.json` ("Start und Ziel tauschen")
- [ ] Set `title={t('planner.swapDirection')}` and `aria-label={t('planner.swapDirection')}` on the button for accessibility
- [ ] **Checkpoint**: Manual verification — open the planner, set start + destination, click swap. Verify locations swap, route preview updates. Test with waypoints. Test with GPX import. Test disabled state when only start is set.

## Phase 2: Edge Cases & Polish

**Owner: Frontend Developer**

- [ ] Verify that swapping with no waypoints works (only locations swap)
- [ ] Verify that waypoints with missing coordinates are still reversed in order
- [ ] Verify that swapping a GPX-imported route reverses the geometry and preview updates correctly
- [ ] Verify that swapping marks the form as dirty (unsaved-changes detection)
- [ ] Verify the button is correctly disabled when either location is missing
- [ ] Run `cd frontend && npm run build` to confirm no TypeScript errors
- [ ] **Checkpoint**: Manual verification — full walkthrough of all edge cases (EC-1 through EC-7 from the feature spec)
