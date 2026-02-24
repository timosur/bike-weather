# My Routes

## Overview

Optional section for logged-in users showing all saved routes as a card overview. Each card displays route name, start location, distance, riding style, and the last weather condition rating. Users can tap a route to fetch a fresh Ride Report, edit route details, or delete a route. An empty state with a call-to-action is shown when no routes exist.

## User Flows

1. **View Routes:** User sees a card overview of all saved routes, sorted by last accessed (newest first).
2. **Open Route:** User taps a route card to fetch a fresh Ride Report with the saved parameters.
3. **Edit Route:** User opens the three-dot context menu on a card and selects "Edit". A modal appears with editable fields for route name, start location, distance, and riding style.
4. **Delete Route:** User opens the context menu and selects "Delete". A confirmation dialog appears ("Really delete this route?") with "Cancel" and "Delete" buttons.
5. **Empty State:** When no routes are saved, the user sees "No routes saved yet" text and a "Plan First Route" button that navigates to the Ride Planner.

## Components Provided

### `MyRoutes`

The top-level route list component. Renders the page heading ("My Routes" with route count badge), the route card grid, and the empty state when applicable.

### `RouteCard`

Individual route card displaying route name, start location, total distance, riding style, and a color-coded condition badge from the last report. Includes a three-dot context menu with "Edit" and "Delete" actions.

### `EditRouteModal`

Modal dialog for editing a saved route's details: name, start location, distance, and riding style. Includes "Save" and "Cancel" buttons.

### `DeleteConfirmDialog`

Confirmation dialog shown before deleting a route. Displays "Really delete this route?" with "Cancel" and "Delete" buttons.

### `EmptyRoutes`

Empty state component shown when the user has no saved routes. Displays an illustration placeholder, "No routes saved yet" text, and a "Plan First Route" CTA button.

## Callback Props

| Callback | Signature | Description |
|---|---|---|
| `onRouteSelect` | `(routeId: string) => void` | Called when the user taps a route card. Host should fetch a fresh Ride Report. |
| `onRouteEdit` | `(routeId: string, updates: Partial<...>) => void` | Called when the user saves edits to a route. Updates can include name, startLocation, totalDistance, ridingStyle. |
| `onRouteDelete` | `(routeId: string) => void` | Called when the user confirms deletion of a route. Host should remove the route. |
| `onNavigateToPlanner` | `() => void` | Called when the user clicks "Plan First Route" in the empty state. Host should navigate to the Ride Planner. |

## Data Dependencies

- `routes: SavedRoute[]` -- Array of saved routes with metadata and last condition rating
