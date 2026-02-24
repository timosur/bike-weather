# My Routes Tests

## Overview

Test the My Routes section including route card display, editing via modal, delete confirmation, empty state with CTA, and route selection for fresh reports.

## User Flow Tests

### Route Card Click

1. Render `MyRoutes` with 3 saved routes.
2. Verify 3 route cards are displayed with route name, start location, distance, riding style, and condition badge.
3. Click the first route card.
4. Verify `onRouteSelect` is called with the first route's `id`.

### Edit Route (Success)

1. Render `MyRoutes` with routes.
2. Click the three-dot menu (context menu) on a route card.
3. Click "Edit" in the dropdown.
4. Verify the `EditRouteModal` appears with the current route name, start location, distance, and riding style pre-filled.
5. Change the route name to "Updated Route Name".
6. Click "Save".
7. Verify `onRouteEdit` is called with `(routeId, { name: "Updated Route Name" })`.

### Delete Route (Confirm)

1. Click the three-dot menu on a route card.
2. Click "Delete" in the dropdown.
3. Verify the `DeleteConfirmDialog` appears with the text "Really delete this route?".
4. Click the "Delete" button in the dialog.
5. Verify `onRouteDelete` is called with the route's `id`.

### Delete Route (Cancel)

1. Click the three-dot menu on a route card.
2. Click "Delete" in the dropdown.
3. Verify the `DeleteConfirmDialog` appears.
4. Click "Cancel".
5. Verify `onRouteDelete` is NOT called.
6. Verify the dialog closes and the route card remains.

### Empty State CTA

1. Render `MyRoutes` with `routes: []`.
2. Verify the text "No routes saved yet" is displayed.
3. Verify a "Plan First Route" button is visible.
4. Click the "Plan First Route" button.
5. Verify `onNavigateToPlanner` is called.

## Empty State Tests

### No Routes

1. Render `MyRoutes` with an empty `routes` array.
2. Verify the `EmptyRoutes` component is rendered.
3. Verify illustration placeholder, "No routes saved yet" text, and "Plan First Route" button are displayed.
4. Verify no route cards are rendered.

## Component Interaction Tests

### RouteCard

1. Render `RouteCard` with a saved route.
2. Verify route name is displayed as heading.
3. Verify start location icon and text are visible.
4. Verify distance is formatted (e.g. "25 km").
5. Verify riding style is shown.
6. Verify condition badge matches `lastCondition` color (green/yellow/orange/red).
7. Verify route with `lastCondition: null` shows no condition badge or a neutral state.

### RouteCard Condition Badge Colors

1. Render with `lastCondition: "ideal"` -- verify green badge.
2. Render with `lastCondition: "good"` -- verify yellow badge.
3. Render with `lastCondition: "caution"` -- verify orange badge.
4. Render with `lastCondition: "not-recommended"` -- verify red badge.
5. Render with `lastCondition: null` -- verify no badge or neutral indicator.

### EditRouteModal

1. Render `EditRouteModal` with a route.
2. Verify all fields (name, start location, distance, riding style) are pre-filled.
3. Clear the name field and try to save -- verify validation prevents empty name.
4. Enter a valid name and click "Save".
5. Click "Cancel" -- verify modal closes without calling edit callback.

### DeleteConfirmDialog

1. Render `DeleteConfirmDialog`.
2. Verify "Really delete this route?" text is shown.
3. Verify "Cancel" and "Delete" buttons are present.

### Page Heading

1. Render `MyRoutes` with 5 routes.
2. Verify the heading "My Routes" is displayed.
3. Verify a route count badge shows "5".

## Edge Cases

- Route with very long name (100+ characters) -- verify truncation.
- Route with `lastUsed: null` (never queried) -- verify "Never used" or similar text.
- Route with `totalDistance: 0`.
- 50+ saved routes -- verify grid layout handles many cards.
- Rapid-fire clicks on delete and cancel.

## Accessibility Checks

- Route cards are focusable and activatable via Enter or Space.
- Three-dot menu button has `aria-label` (e.g. "Route options").
- Modal dialog traps focus and can be closed with Escape.
- Delete confirm dialog is announced to screen readers.
- Empty state CTA button is focusable.
- Route count badge is accessible (e.g. `aria-label="5 routes"`).

## Sample Test Data

```typescript
const savedRoutes: SavedRoute[] = [
  {
    id: "route-1",
    name: "Daily Commute",
    startLocation: "Berlin Mitte",
    totalDistance: 12,
    distanceUnit: "km",
    ridingStyle: "Easy",
    lastCondition: "ideal",
    lastUsed: "2026-02-20T08:30:00Z",
    createdAt: "2026-01-15T10:00:00Z",
  },
  {
    id: "route-2",
    name: "Weekend Gravel Loop",
    startLocation: "Potsdam",
    totalDistance: 65,
    distanceUnit: "km",
    ridingStyle: "Sporty",
    lastCondition: "caution",
    lastUsed: "2026-02-18T07:00:00Z",
    createdAt: "2026-02-01T14:30:00Z",
  },
  {
    id: "route-3",
    name: "Bikepacking Brandenburg",
    startLocation: "Berlin Hauptbahnhof",
    totalDistance: 180,
    distanceUnit: "km",
    ridingStyle: "Touring",
    lastCondition: null,
    lastUsed: null,
    createdAt: "2026-02-10T09:00:00Z",
  },
];

const emptyRoutes: SavedRoute[] = [];
```
