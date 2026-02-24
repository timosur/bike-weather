# Ride Planner

## Overview

The Ride Planner is the primary entry point of Fahrrad Wetter. Users enter their ride details -- location, date, bike type, intensity, and optionally distance and elevation -- then submit to receive personalized weather-based clothing and gear recommendations. The form supports single-day rides and multi-day tours with per-day overnight stops.

## User Flows

1. **Location Entry:** User types an address into the search field. Autocomplete suggestions appear as they type. User selects a suggestion to populate the location.
2. **GPS Detection:** User clicks "Use current location" to auto-fill the address via browser geolocation.
3. **Date and Time:** User picks a start date and time for the ride.
4. **Bike Type:** User selects from four options: Road, Gravel, MTB, City (segmented control or card toggle).
5. **Riding Intensity:** User selects Easy, Moderate, or Sporty from a segmented control.
6. **Advanced Options:** User optionally expands a collapsible section to enter distance (km) and elevation (meters).
7. **Multi-Day Mode:** User toggles multi-day mode and adds overnight stops with locations and planned km per day. End date is auto-calculated.
8. **Quick Presets:** User can click a preset button (e.g. "Weekend Tour", "Daily Commute") to pre-fill common configurations.
9. **Submit:** User clicks "Get weather" to submit the form and navigate to the Ride Report page.

## Components Provided

### `RidePlanner`

The main form component. Renders the full ride planning interface including location search, date/time pickers, bike type selector, intensity control, advanced options, multi-day stops, presets, and submit button. Max-width ~480px centered.

### `LocationPicker`

Standalone location input with autocomplete dropdown and GPS button. Used for both the primary location field and day-stop location fields.

### `DayLocationList`

Renders the list of overnight stop inputs for multi-day tours. Each stop has a location field, planned km input, and a remove button. Includes an "Add stop" button at the bottom.

## Callback Props

| Callback | Signature | Description |
|---|---|---|
| `onLocationSearch` | `(query: string) => void` | Called as the user types in the primary location field. Host should fetch autocomplete suggestions. |
| `onUseCurrentLocation` | `() => void` | Called when the user clicks the GPS button. Host should invoke browser geolocation and populate the location. |
| `onLocationSelect` | `(suggestion: LocationSuggestion) => void` | Called when the user selects an autocomplete suggestion. |
| `onDayStopLocationSearch` | `(stopIndex: number, query: string) => void` | Called as the user types in a day-stop location field. Host should fetch suggestions for that stop. |
| `onPresetSelect` | `(preset: QuickPreset) => void` | Called when the user clicks a quick preset button. Host should pre-fill the form. |
| `onSubmit` | `(input: RideInput) => void` | Called when the user submits the form with valid input. Host should navigate to the Ride Report. |

## Data Dependencies

- `bikeTypeOptions: BikeTypeOption[]` -- The four bike type options to display
- `intensityOptions: RidingIntensityOption[]` -- The three intensity options
- `quickPresets?: QuickPreset[]` -- Optional preset buttons
- `locationSuggestions?: LocationSuggestion[]` -- Autocomplete results for primary location
- `dayStopLocationSuggestions?: LocationSuggestion[]` -- Autocomplete results for day-stop location
- `validationErrors?: ValidationErrors` -- Inline error messages
- `isLoading?: boolean` -- Loading state for the submit button
- `initialValues?: Partial<RideInput>` -- Pre-filled values (e.g. from a saved route)
