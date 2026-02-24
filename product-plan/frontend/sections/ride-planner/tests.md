# Ride Planner Tests

## Overview

Test the Ride Planner form component including location search, GPS detection, bike type and intensity selection, multi-day mode, quick presets, form validation, and submission.

## User Flow Tests

### Location Search (Success)

1. Render `RidePlanner` with `bikeTypeOptions` and `intensityOptions`.
2. Type "Berlin" into the location field (placeholder: "Enter address or city").
3. Verify `onLocationSearch` is called with `"Berlin"`.
4. Pass `locationSuggestions` containing `[{ id: "1", displayText: "Berlin, Germany", shortText: "Berlin", lat: 52.52, lon: 13.40 }]`.
5. Verify the suggestion "Berlin, Germany" appears in the dropdown.
6. Click the suggestion "Berlin, Germany".
7. Verify `onLocationSelect` is called with the suggestion object.
8. Verify the location field displays "Berlin, Germany".

### Location Search (No Results)

1. Type "xyznonexistent" into the location field.
2. Verify `onLocationSearch` is called with `"xyznonexistent"`.
3. Pass `locationSuggestions` as `[]`.
4. Verify no suggestion dropdown appears or an empty state message is shown.

### GPS Detection

1. Click the "Use current location" button.
2. Verify `onUseCurrentLocation` is called.

### Form Submission (Success)

1. Fill in a valid location, start date, start time, select "Road" bike type, select "Moderate" intensity.
2. Click the "Get weather" button.
3. Verify `onSubmit` is called with a `RideInput` object containing the entered values.

### Form Submission (Validation Errors)

1. Leave the location field empty.
2. Click the "Get weather" button.
3. Pass `validationErrors` with `{ location: "Location is required", startDate: null, startTime: null, bikeType: null, intensity: null }`.
4. Verify the error message "Location is required" appears near the location field.
5. Verify the location field has an error highlight.

### Multi-Day Mode Toggle

1. Enable the "Multi-day Tour" toggle.
2. Verify the day stops section appears.
3. Click "Add stop" to add an overnight stop.
4. Type "Munich" into the stop location field.
5. Verify `onDayStopLocationSearch` is called with `(0, "Munich")`.
6. Enter "120" in the planned km field.
7. Verify the end date is auto-calculated and displayed.

### Quick Preset Selection

1. Render with `quickPresets` containing `[{ id: "commute", label: "Daily Commute", description: "Short city ride", bikeType: "city", intensity: "moderat", distanceKm: 15, isMultiDay: false }]`.
2. Click the "Daily Commute" preset button.
3. Verify `onPresetSelect` is called with the preset object.

### Loading State

1. Set `isLoading` to `true`.
2. Verify the "Get weather" button shows a loading spinner or is disabled.

## Empty State Tests

### No Suggestions When Query Empty

1. Render `RidePlanner` with no `locationSuggestions`.
2. Verify no autocomplete dropdown is visible.

### No Presets

1. Render `RidePlanner` without `quickPresets`.
2. Verify no preset buttons are rendered.

## Component Interaction Tests

### LocationPicker Standalone

1. Render `LocationPicker` with a search handler.
2. Type into the input.
3. Verify the search callback fires.
4. Click the GPS button.
5. Verify the GPS callback fires.

### DayLocationList

1. Render `DayLocationList` with two existing stops.
2. Verify two stop rows are visible with location fields and km inputs.
3. Click the remove button on the first stop.
4. Verify only one stop remains.
5. Click "Add stop".
6. Verify three stop rows are visible.

## Edge Cases

- Submit with all optional fields empty (only required fields filled).
- Toggle multi-day mode on and off; verify stops are cleared.
- Enter a very long address string (200+ characters).
- Set a start date in the past.
- Enter negative values in km and elevation fields.

## Accessibility Checks

- All form fields have associated labels.
- The location autocomplete dropdown is keyboard-navigable.
- Error messages are linked to their fields via `aria-describedby`.
- The "Get weather" button is focusable and activatable via Enter.
- The multi-day toggle has an accessible label.

## Sample Test Data

```typescript
const bikeTypeOptions: BikeTypeOption[] = [
  { value: "rennrad", label: "Road", description: "Fast road cycling", icon: "road" },
  { value: "gravel", label: "Gravel", description: "Mixed terrain", icon: "gravel" },
  { value: "mtb", label: "MTB", description: "Mountain biking", icon: "mtb" },
  { value: "city", label: "City", description: "Urban commuting", icon: "city" },
];

const intensityOptions: RidingIntensityOption[] = [
  { value: "gemuetlich", label: "Easy", description: "Relaxed pace" },
  { value: "moderat", label: "Moderate", description: "Steady effort" },
  { value: "sportlich", label: "Sporty", description: "High intensity" },
];

const quickPresets: QuickPreset[] = [
  {
    id: "commute",
    label: "Daily Commute",
    description: "Short city ride",
    bikeType: "city",
    intensity: "moderat",
    distanceKm: 15,
    isMultiDay: false,
  },
  {
    id: "weekend-tour",
    label: "Weekend Tour",
    description: "Longer recreational ride",
    bikeType: "rennrad",
    intensity: "sportlich",
    distanceKm: 80,
    isMultiDay: false,
  },
];

const locationSuggestions: LocationSuggestion[] = [
  { id: "1", displayText: "Berlin, Germany", shortText: "Berlin", lat: 52.52, lon: 13.405 },
  { id: "2", displayText: "Berlin Mitte, Berlin", shortText: "Berlin Mitte", lat: 52.521, lon: 13.409 },
];

const validationErrors: ValidationErrors = {
  location: "Location is required",
  startDate: null,
  startTime: null,
  bikeType: null,
  intensity: null,
};
```
