# Plan: BIKE-22 — Report & Routes UI Improvements

> Status: Completed
> Feature spec: [BIKE-22](../features/BIKE-22-report-ui-improvements.md)
> Created: 2026-03-17

## Phase 1: Frontend — Route "Re-plan" Action

**Owner: Frontend Developer**

- [x] In `frontend/src/components/my-routes/types.ts`: rename `onRouteEdit` to `onRouteReplan` with simplified signature `(routeId: string) => void` (no updates payload)
- [x] In `frontend/src/components/my-routes/RouteCard.tsx`: rename `onEdit` prop to `onReplan`, change the menu label from `t('routes.actions.edit')` to `t('routes.actions.replan')`, swap `Pencil` icon for `RotateCcw` or `RefreshCw` icon
- [x] In `frontend/src/components/my-routes/MyRoutes.tsx`: remove `EditRouteModal` import and render, remove `editingRoute` state, wire `onReplan` callback through to `RouteCard`
- [x] In `frontend/src/pages/RoutesPage.tsx`: replace `handleRouteEdit` with `handleRouteReplan(routeId)` — find the route's `rideInput`, override `startDate`/`startTime` to now, navigate to `/planner/${routeId}` with `{ editInput }` state. Handle legacy routes (no `rideInput`) by constructing a minimal `RideInput` from basic fields.
- [x] Delete `frontend/src/components/my-routes/EditRouteModal.tsx`
- [x] Update `frontend/src/i18n/locales/de.json`: add `routes.actions.replan` = "Neu planen", remove `routes.actions.edit` and `routes.edit.*` keys
- [x] Update `frontend/src/i18n/locales/en.json`: add `routes.actions.replan` = "Re-plan", remove `routes.actions.edit` and `routes.edit.*` keys
- [x] **Checkpoint**: Manual verification — navigate to My Routes, click three-dot menu on a route, confirm "Re-plan" appears. Click it, verify planner opens with route data pre-filled and today's date/current time. Verify `EditRouteModal` no longer appears anywhere.

## Phase 2: Frontend — Ride Date/Time in Report Header

**Owner: Frontend Developer**

- [x] In `frontend/src/components/ride-report/RideReport.tsx`: in the first meta row (after riding style), add a `Calendar` icon + locale-formatted date from `report.days[0].date` and the start time from `report.days[0].rideStartTime`. Use `Intl.DateTimeFormat` with `i18n.language` for the date. For multi-day rides, show first day's date.
- [x] **Checkpoint**: Manual verification — generate a report from the planner. Confirm the sub-header shows the ride date (e.g., "17. März 2026") and start time (e.g., "14:00"). Check a shared report URL shows the same. Check multi-day report shows first day date.

## Phase 3: Frontend — Clothing Grouped by Body Zone

**Owner: Frontend Developer**

- [x] Create `frontend/src/components/ride-report/ClothingList.tsx`: new component that accepts `items: ClothingItem[]` + a product finder callback + `onProductClick`. Groups items by body zone using an ID-to-zone mapping (mirroring backend's `_ITEM_ZONE`). Renders grouped list with zone headers and compact list items (name, reason, alternatives as text pills, product link slot). Follows `EquipmentList` visual pattern.
- [x] Update `frontend/src/i18n/locales/de.json`: add `report.clothing.zone.*` keys (head="Kopf", eyes="Augen", neck="Hals", upperBody="Oberkörper", lowerBody="Unterkörper", hands="Hände", feet="Füße", other="Sonstiges")
- [x] Update `frontend/src/i18n/locales/en.json`: add `report.clothing.zone.*` keys (head="Head", eyes="Eyes", neck="Neck", upperBody="Upper Body", lowerBody="Lower Body", hands="Hands", feet="Feet", other="Other")
- [x] In `frontend/src/components/ride-report/RideReport.tsx`: replace the clothing `grid` + `ClothingItemCard` map with a single `<ClothingList>` component call. Pass the product finder and `onProductClick` through.
- [x] Update `frontend/src/components/ride-report/index.ts`: replace `ClothingItemCard` export with `ClothingList`
- [x] Delete `frontend/src/components/ride-report/ClothingItemCard.tsx` (fully replaced)
- [x] **Checkpoint**: Manual verification — generate a report with varied weather (cold enough for multiple zones). Confirm clothing section shows grouped headers (e.g., "Kopf", "Oberkörper", "Hände"). Confirm each item shows name + reason in a compact list row. Confirm alternatives appear as text pills. Confirm product links still render for matched items. Switch language to EN and verify translated headers. Test a multi-day report's merged packing list uses the same grouped layout.

## Phase 4: Cleanup & Final Verification

**Owner: Frontend Developer**

- [x] Verify no leftover imports of deleted components (`EditRouteModal`, `ClothingItemCard`) across the codebase
- [x] Run `cd frontend && npm run build` to confirm zero TypeScript/build errors
- [ ] Run `make test-frontend` (Playwright E2E) to catch regressions
- [x] **Checkpoint**: Manual verification — full feature walkthrough: My Routes → Re-plan → Report (check date, check clothing zones) → Save Changes works → Shared report shows date/clothing zones correctly
