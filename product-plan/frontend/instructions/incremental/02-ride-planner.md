# Milestone 2: Ride Planner

> **Provide alongside:** `product-overview.md`
> **Prerequisites:** Milestone 1 (Shell) complete

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

Implement the Ride Planner — the primary entry point where users enter ride details to receive personalized weather-based clothing recommendations.

## Overview

The Ride Planner is a compact form where cyclists enter their starting location, date/time, bike type, intensity, and optionally distance/elevation. For multi-day tours, users can add overnight stops. Submitting navigates to the Ride Report.

**Key Functionality:**
- Search for a location with autocomplete suggestions
- Detect current location via GPS geolocation
- Select bike type (Road, Gravel, MTB, City) and riding intensity (Easy, Moderate, Sporty)
- Toggle advanced options for distance and elevation
- Enable multi-day mode with overnight stop locations
- Submit to generate a weather-based Ride Report

## Components Provided

Copy from `product-plan/sections/ride-planner/components/`:

- `RidePlanner` — Main form component with all inputs
- `LocationPicker` — Location search with autocomplete, GPS button, and three states (idle, search, selected)
- `DayLocationList` — Multi-day overnight stop list with add/remove

## Props Reference

**Data props:**
- `initialValues?: Partial<RideInput>` — Pre-fill form from saved route
- `locationSuggestions?: LocationSuggestion[]` — Autocomplete results
- `bikeTypeOptions: BikeTypeOption[]` — Four bike types
- `intensityOptions: RidingIntensityOption[]` — Three intensity levels
- `quickPresets?: QuickPreset[]` — Shortcut buttons

**Callback props:**

| Callback | Triggered When |
|----------|---------------|
| `onLocationSearch` | User types in location field |
| `onUseCurrentLocation` | User clicks GPS detect button |
| `onLocationSelect` | User picks an autocomplete suggestion |
| `onDayStopLocationSearch` | User types in a day stop location field |
| `onPresetSelect` | User clicks a quick preset button |
| `onSubmit` | User submits the form with valid input |

## Expected User Flows

### Flow 1: Single-day ride

1. User clicks "Search location" button
2. User types an address and selects a suggestion
3. User picks a date and time
4. User selects bike type and intensity
5. User clicks "Get weather"
6. **Outcome:** Form submits, user navigates to Ride Report

### Flow 2: Multi-day tour

1. User fills in start location, date, bike type, intensity
2. User toggles "Multi-day tour" on
3. User adds overnight stops with locations
4. User clicks "Get weather"
5. **Outcome:** Form submits with day stops, multi-day Ride Report generated

### Flow 3: GPS location detection

1. User clicks "Detect location"
2. Browser prompts for permission
3. Location auto-fills with detected address
4. **Outcome:** Location field shows detected address with clear button

## Testing

See `product-plan/sections/ride-planner/tests.md` for UI behavior test specs.

## Files to Reference

- `product-plan/sections/ride-planner/README.md`
- `product-plan/sections/ride-planner/tests.md`
- `product-plan/sections/ride-planner/components/`
- `product-plan/sections/ride-planner/types.ts`
- `product-plan/sections/ride-planner/sample-data.json`

## Done When

- [ ] Location search with autocomplete works
- [ ] GPS location detection works
- [ ] Bike type and intensity selectors work
- [ ] Advanced options (distance, elevation) expand/collapse
- [ ] Multi-day mode adds/removes overnight stops
- [ ] Form validates required fields
- [ ] Submit navigates to Ride Report with parameters
- [ ] Responsive on mobile
