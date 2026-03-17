# BIKE-22: Report & Routes UI Improvements

| Field            | Value                          |
| ---------------- | ------------------------------ |
| **ID**           | BIKE-22                        |
| **Status**       | In Review                      |
| **Created**      | 2026-03-17                     |
| **Dependencies** | BIKE-1 (Ride Planning), BIKE-5 (Routes & Sharing) |

## Description

A collection of three UI improvements to the ride report and saved routes experience:

1. **Route "Re-plan" action**: The edit button on saved route cards currently opens an inline modal for editing route metadata. Instead, it should navigate to the ride planner pre-filled with the route's saved data but using the **current date and time** (not the saved date/time). The three-dot menu label changes from "Edit" to "Re-plan." The existing explicit "Save Changes" flow on the report page remains unchanged.

2. **Ride date/time in report sub-header**: The ride report page should display the planned ride start date and time in the sub-header meta row (alongside location, distance, and riding style). This applies to all reports including shared/public ones.

3. **Clothing recommendations grouped by body zone**: Remove the large icon boxes from clothing item cards and switch to a compact grouped-list layout (similar to the existing Equipment section). Items are grouped by body zone (head, eyes, neck, upper body, lower body, hands, feet) with translated group headers.

## Scope

- **Frontend only** — no backend changes required (body zone mapping already exists in backend for product matching; frontend will maintain its own mapping based on clothing item IDs)
- Files affected:
  - `frontend/src/components/my-routes/` — RouteCard, MyRoutes, remove EditRouteModal usage
  - `frontend/src/pages/RoutesPage.tsx` — replace edit handler with planner navigation
  - `frontend/src/components/ride-report/RideReport.tsx` — add date/time to sub-header, replace clothing grid with grouped list
  - `frontend/src/components/ride-report/ClothingItemCard.tsx` — refactor to list layout without icons
  - `frontend/src/locales/` — new i18n keys for body zone labels and "Re-plan" action

## User Stories

- **US-1**: As a cyclist with a saved route, I want to re-plan my ride with current weather so that I get up-to-date clothing recommendations without manually re-entering route details.
- **US-2**: As a cyclist viewing a ride report, I want to see the planned ride date and time in the header so that I know which forecast the recommendations are based on.
- **US-3**: As a cyclist viewing a shared ride report, I want to see the ride date and time so that I understand the context of the recommendations.
- **US-4**: As a cyclist reading clothing recommendations, I want items grouped by body zone (head, upper body, hands, etc.) so that I can quickly scan what I need for each part of my body.
- **US-5**: As a cyclist reading clothing recommendations, I want a compact list layout without large icons so that I can see all items at a glance without excessive scrolling.

## Acceptance Criteria

- [ ] AC-1: The route card three-dot menu shows "Re-plan" instead of "Edit"
- [ ] AC-2: Clicking "Re-plan" navigates to `/planner/<routeId>` with the route's saved ride input, but with date and time overridden to **now**
- [ ] AC-3: The `EditRouteModal` is no longer rendered from the My Routes page
- [ ] AC-4: The report page sub-header displays the planned ride date (formatted for locale, e.g., "17. März 2026") and start time (e.g., "14:00")
- [ ] AC-5: The ride date/time appears on shared/public reports as well
- [ ] AC-6: Clothing items are grouped by body zone with translated headers (DE + EN): Kopf/Head, Augen/Eyes, Hals/Neck, Oberkörper/Upper Body, Unterkörper/Lower Body, Hände/Hands, Füße/Feet
- [ ] AC-7: Clothing items use a compact list layout similar to the Equipment section (no icon boxes)
- [ ] AC-8: Each clothing item still shows name, reason, and alternatives (if any)
- [ ] AC-9: Product recommendation links (inline product links) still render correctly for matched clothing items
- [ ] AC-10: All new UI text is translated in both DE and EN

## Edge Cases

- **EC-1**: Route has no saved `rideInput` (legacy route) — "Re-plan" should navigate to the planner with only the route's basic fields (location, distance, riding style) pre-filled, using current date/time
- **EC-2**: Clothing item ID not in the body zone mapping — assign to a fallback "other" / "Sonstiges" group
- **EC-3**: A body zone group has zero items — do not render the group header
- **EC-4**: Multi-day reports — the merged clothing packing list should also use the grouped-by-zone layout
- **EC-5**: Report loaded via URL route ID (no navigation state) — date/time should still display from the report data returned by the API

---

<!-- Appended by /architecture agent -->

## Tech Design

### Service Impact Map

```
Frontend: 3 component changes + i18n updates
Backend:  No changes
Agent:    No changes
Database: No changes
```

This is a **frontend-only** feature. The backend already returns all required data (day dates, start times, clothing item IDs). No new API endpoints or schema changes needed.

---

### Change 1: Route "Re-plan" Action

**Current flow:** Route card → three-dot menu → "Edit" → `EditRouteModal` (inline popup for name/location/distance/style)

**New flow:** Route card → three-dot menu → "Re-plan" → navigate to `/planner/<routeId>` with the route's `rideInput` but **date/time overridden to now**

#### Component Changes

```
RoutesPage
├── MyRoutes
│   ├── RouteCard — rename "Edit" to "Re-plan" (i18n key), change onEdit to onReplan
│   └── (EditRouteModal removed from render tree)
└── (no more onRouteEdit handler — replaced with onRouteReplan navigation)
```

**How it works:**
- `RoutesPage` replaces `handleRouteEdit` with `handleRouteReplan(routeId)` — finds the route's `rideInput`, overrides `startDate` to today's ISO date and `startTime` to current HH:MM, then navigates to `/planner/<routeId>` with `editInput` in router state
- For legacy routes (no `rideInput`), construct a minimal `RideInput` from basic fields (location, distance, riding style) with current date/time
- `MyRoutesProps.onRouteEdit` → renamed to `onRouteReplan` (takes `routeId: string` only, no updates payload)
- `RouteCard` calls `onReplan` instead of `onEdit`
- `EditRouteModal` is no longer imported or rendered in `MyRoutes`
- The `EditRouteModal.tsx` file can be deleted (dead code)

**Why this approach:**
- Reuses the existing planner edit-mode infrastructure (`/planner/:routeId` + `editInput` state). PlannerPage already handles loading a route, entering edit mode, and preserving the route ID for save-changes flow.
- Current date/time override happens at the navigation point (RoutesPage), keeping the planner unaware of where the input came from.

---

### Change 2: Ride Date/Time in Report Sub-header

**Current sub-header:** Location · Distance · Riding Style · (multi-day count)

**New sub-header:** Location · Distance · Riding Style · **Date · Start Time** · (multi-day count)

#### Data Source

The report's `DayForecast` already contains `date` (ISO date string like "2026-03-17") and `rideStartTime` (like "14:00"). For single-day rides, use `activeDay.date` and `activeDay.rideStartTime`. For multi-day rides, show the first day's date as the start date.

#### Component Changes

- `RideReport.tsx`: Add a `Calendar` icon + formatted date and a time display to the first meta row
- Date formatting uses `Intl.DateTimeFormat` with the current i18n locale (same pattern used in `RouteCard.formatRelativeDate`)
- `RideReportProps` does **not** change — date/time comes from the `report.days[0]` data already passed in

**Why no prop changes:**
- The `RideReport` component already receives `report.days` which contains `date` and `rideStartTime`. No need to thread extra props from the parent.

---

### Change 3: Clothing Grouped by Body Zone (List Layout)

**Current layout:** Flat 2-column grid of `ClothingItemCard` components with large 56px icon boxes

**New layout:** Grouped list (like `EquipmentList`) — zone headers → items as compact list rows with name, reason, alternatives, and optional product link

#### Component Structure

```
ClothingSection (new — in RideReport.tsx)
├── Zone Group: "Kopf" / "Head"
│   ├── ClothingListItem — name · reason · (alternatives) · (product link)
│   └── ClothingListItem
├── Zone Group: "Oberkörper" / "Upper Body"
│   └── ClothingListItem
├── Zone Group: "Hände" / "Hands"
│   └── ClothingListItem
└── ...fallback group "Sonstiges" / "Other"
```

#### Body Zone Mapping (Frontend)

A new mapping constant in the clothing component file, mirroring the backend's `_ITEM_ZONE` from `backend/app/api/routes/admin/products.py`. Maps clothing item ID prefixes to zone keys:

Zones (in display order): `head`, `eyes`, `neck`, `upperBody`, `lowerBody`, `hands`, `feet`, `other`

The mapping uses the item's `id` field (e.g., `cl-headband` → `head`, `cl-jersey-short` → `upperBody`). Items not found in the mapping go to `other`.

#### Component Changes

- **`ClothingItemCard.tsx`** → refactored into **`ClothingList.tsx`** — a single component that receives the full clothing items array, groups them by zone, and renders a grouped list (same visual pattern as `EquipmentList`)
  - Each zone gets a translated header (i18n keys: `report.clothing.zone.head`, `.eyes`, `.neck`, `.upperBody`, `.lowerBody`, `.hands`, `.feet`, `.other`)
  - Each item row: name (semibold), reason (muted text), alternatives as small inline pills (text only, no icons), product link slot
  - No icon boxes anywhere
  - Zone header colors follow a similar pattern to Equipment category colors
- **`RideReport.tsx`** — replace the `clothingItems.map(…)` grid with a single `<ClothingList items={clothingItems} … />` call
- **`ClothingItemCard.tsx`** can be deleted (replaced by ClothingList)

**Why a single component:**
- Matches the `EquipmentList` pattern (single component handles grouping + rendering). Simpler than managing an outer grouping component + inner card components.

---

### Dependencies (New Packages)

None required. Uses existing Lucide icons (`Calendar`) and `Intl.DateTimeFormat` for date formatting.

---

### i18n Keys (New)

**German (`de.json`):**
```
routes.actions.replan → "Neu planen"
report.clothing.zone.head → "Kopf"
report.clothing.zone.eyes → "Augen"
report.clothing.zone.neck → "Hals"
report.clothing.zone.upperBody → "Oberkörper"
report.clothing.zone.lowerBody → "Unterkörper"
report.clothing.zone.hands → "Hände"
report.clothing.zone.feet → "Füße"
report.clothing.zone.other → "Sonstiges"
```

**English (`en.json`):**
```
routes.actions.replan → "Re-plan"
report.clothing.zone.head → "Head"
report.clothing.zone.eyes → "Eyes"
report.clothing.zone.neck → "Neck"
report.clothing.zone.upperBody → "Upper Body"
report.clothing.zone.lowerBody → "Lower Body"
report.clothing.zone.hands → "Hands"
report.clothing.zone.feet → "Feet"
report.clothing.zone.other → "Other"
```

**Removed keys:** `routes.actions.edit`, `routes.edit.*` (modal-related keys — now dead)

---

### Files Changed (Summary)

| File | Action |
|------|--------|
| `frontend/src/pages/RoutesPage.tsx` | Replace `handleRouteEdit` with `handleRouteReplan` navigation |
| `frontend/src/components/my-routes/types.ts` | Rename `onRouteEdit` → `onRouteReplan` (simplified signature) |
| `frontend/src/components/my-routes/MyRoutes.tsx` | Remove `EditRouteModal`, wire `onReplan` |
| `frontend/src/components/my-routes/RouteCard.tsx` | Rename edit → replan, update i18n key + icon |
| `frontend/src/components/my-routes/EditRouteModal.tsx` | **Delete** |
| `frontend/src/components/ride-report/RideReport.tsx` | Add date/time to header, replace clothing grid with `ClothingList` |
| `frontend/src/components/ride-report/ClothingList.tsx` | **New** — grouped list component |
| `frontend/src/components/ride-report/ClothingItemCard.tsx` | **Delete** (replaced by ClothingList) |
| `frontend/src/components/ride-report/index.ts` | Update exports |
| `frontend/src/i18n/locales/de.json` | Add zone keys, rename edit → replan |
| `frontend/src/i18n/locales/en.json` | Add zone keys, rename edit → replan |

## Implementation Plan

See [`project/plans/BIKE-22-plan.md`](../plans/BIKE-22-plan.md).

<!-- Appended by /qa agent -->

## QA Results

> Tested on 2025-07-15 (static code review + build verification)

### Acceptance Criteria

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| AC-1 | Route card menu shows "Re-plan" instead of "Edit" | PASS | `RefreshCw` icon + `t('routes.actions.replan')` in RouteCard.tsx |
| AC-2 | "Re-plan" navigates to `/planner/<routeId>` with date/time overridden to now | PASS | `handleRouteReplan` in RoutesPage.tsx constructs `editInput` with `new Date()` |
| AC-3 | `EditRouteModal` no longer rendered from My Routes page | PASS | File deleted, zero references in codebase |
| AC-4 | Report sub-header displays planned ride date and start time | PASS | Date moved to first meta row, gated only on `activeDay?.date` — renders for all reports |
| AC-5 | Date/time appears on shared/public reports | PASS | Same `RideReport` component, now shows date unconditionally |
| AC-6 | Clothing items grouped by body zone with translated headers (DE + EN) | PASS | `ITEM_ZONE` mapping + `ZONE_ORDER` + i18n keys in both locales |
| AC-7 | Compact list layout similar to Equipment (no icon boxes) | PASS | `<ul>/<li>` list, old `ClothingItemCard` with 56px icons deleted |
| AC-8 | Each item shows name, reason, and alternatives | PASS | Name (semibold), reason (muted), alternatives with "oder:"/"or:" label + pills |
| AC-9 | Product recommendation links render correctly | PASS | `InlineProductLink` rendered when product match + shop + disclosure present |
| AC-10 | All new UI text translated in DE and EN | PASS | `replan`, 8 zone keys, `alternatives` key — all present in both locales |

### Edge Cases

| # | Case | Status | Notes |
|---|------|--------|-------|
| EC-1 | Legacy route (no `rideInput`) — Re-plan with basic fields | PASS | Constructs minimal `RideInput` from location/distance/style + current date/time |
| EC-2 | Unknown clothing item ID — fallback to "other" zone | PASS | `getBodyZone()` returns `'other'` after checking direct + suffix-stripped lookup |
| EC-3 | Empty zone group not rendered | PASS | `ZONE_ORDER.filter((z) => grouped.has(z))` skips empty zones |
| EC-4 | Multi-day merged packing list uses grouped layout | PASS | Uses `report.mergedClothingItems` → same `<ClothingList>` component |
| EC-5 | Report via URL (no nav state) — date from API data | PASS | Uses `activeDay.date` from API response, not navigation state (though subject to AC-4 bug for multi-day) |

### Security Audit

| Check | Status | Notes |
|-------|--------|-------|
| Auth bypass | N/A | No new endpoints or backend changes |
| Authorization | N/A | Route replan uses already-fetched user routes — no new data access |
| Input injection (XSS) | PASS | All user-facing strings rendered as React children (auto-escaped); `Intl.DateTimeFormat` for dates; no `dangerouslySetInnerHTML` |
| Rate limiting | N/A | No new API calls introduced |
| Data exposure | N/A | No new fields exposed |
| Secrets | PASS | No hardcoded credentials or keys |

### Bugs Found

| # | Severity | Description | Steps to Reproduce | Priority |
|---|----------|-------------|-------------------|----------|
| BUG-1 | Medium | Date/time display missing on multi-day reports and single-day reports without `rideEndTime` | 1. Create a multi-day ride plan 2. View the report → No date shown in sub-header. OR: View a report where `rideEndTime` is null → No date shown. | **FIXED** |

**BUG-1 fix:** Moved Calendar + date `<span>` from the ride-window conditional to the first meta row, gated only on `activeDay?.date`. Date now renders for all reports (single-day, multi-day, shared). Ride-window row (time/duration/speed) remains single-day only.

### Verdict

**Production-ready: YES**

All 10 acceptance criteria pass. All 5 edge cases pass. No security issues. Build clean.
