# Milestone 5: My Routes

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestones 1–4, plus Login complete

---

## About This Handoff

**What you're receiving:**
- Finished UI designs (React components with full styling)
- Product requirements and user flow specifications
- Design system tokens (colors, typography)
- Sample data showing the shape of data components expect
- Test specs focused on user-facing behavior

**Your job:**
- Integrate these components into your application
- Wire up callback props to your routing and business logic
- Replace sample data with real data from your backend
- Implement loading, error, and empty states

The components are props-based — they accept data and fire callbacks. How you architect the backend, data layer, and business logic is up to you.

---

## Goal

Implement My Routes — saved routes for logged-in users with CRUD operations.

## Overview

Logged-in users see a card grid of their saved routes. Each card shows route name, start location, distance, riding style, and last weather condition. Users can tap to fetch a fresh report, edit details, or delete routes. An empty state guides first-time users.

**Key Functionality:**
- Card grid of saved routes sorted by last used
- Tap route to fetch fresh Ride Report
- Edit route details (name, location, distance, style) via modal
- Delete route with confirmation dialog
- Empty state with CTA to Ride Planner

## Components Provided

- `MyRoutes` — Main route card grid
- `RouteCard` — Individual route card with context menu
- `EditRouteModal` — Modal form for editing route details
- `DeleteConfirmDialog` — Confirmation dialog for deletion
- `EmptyRoutes` — Empty state with illustration and CTA

## Props Reference

| Callback | Triggered When |
|----------|---------------|
| `onRouteSelect` | User taps a route card |
| `onRouteEdit` | User saves route edits |
| `onRouteDelete` | User confirms deletion |
| `onNavigateToPlanner` | User clicks CTA in empty state |

## Expected User Flows

### Flow 1: Fetch fresh report

1. User taps a route card
2. **Outcome:** App navigates to Ride Report with saved parameters

### Flow 2: Edit route

1. User opens context menu on a card
2. User clicks "Edit"
3. User modifies details in modal
4. User clicks "Save"
5. **Outcome:** Route card updates with new info

### Flow 3: Delete route

1. User opens context menu, clicks "Delete"
2. Confirmation dialog appears
3. User clicks "Delete"
4. **Outcome:** Route removed; empty state appears if last route

## Testing

See `product-plan/sections/my-routes/tests.md`.

## Done When

- [ ] Route cards display with correct data
- [ ] Tap navigates to Ride Report
- [ ] Edit modal opens and saves changes
- [ ] Delete with confirmation works
- [ ] Empty state displays when no routes exist
- [ ] Only visible when logged in
- [ ] Responsive grid layout
