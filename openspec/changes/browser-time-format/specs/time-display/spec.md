# Spec Delta

## Purpose

Defines how clock times are formatted for display across the planner and the ride report, so one page never mixes 12-hour and 24-hour formats.

## ADDED Requirements

### Requirement: Browser hour cycle for displayed times
Every clock time the frontend displays SHALL use the browser locale's hour cycle: 12-hour with AM/PM when the browser locale uses it, 24-hour otherwise. This SHALL hold regardless of the selected app language.

#### Scenario: US browser
- **WHEN** the browser locale is en-US and a pause departs at 17:00
- **THEN** the planner timeline shows "5:00 PM"

#### Scenario: German browser with English UI
- **WHEN** the browser locale is de-DE and the app language is English
- **THEN** the planner timeline shows "17:00"

#### Scenario: Report times
- **WHEN** a report is shown in an en-US browser
- **THEN** ride windows, chart axis labels, chart tooltips and sunrise/sunset use 12-hour format

### Requirement: Generated text follows the requested hour cycle
A report request MAY include `hour12` (boolean, default `false`). Times embedded in generated text (leg labels, early-departure tips, light-equipment reasons) SHALL use 12-hour format when `hour12` is `true`, and `HH:MM` otherwise. Structured time fields (`rideStartTime`, `rideEndTime`, `sunrise`, `sunset`, hourly `hour`) SHALL stay `HH:MM`.

#### Scenario: 12-hour leg label
- **WHEN** a ride with a pause departing 17:00 is requested with `hour12: true` and locale `en`
- **THEN** the second entry is labelled "Leg 2 · 5:00 PM" and its `rideStartTime` is "17:00"

#### Scenario: Default
- **WHEN** `hour12` is omitted
- **THEN** generated text uses "17:00"

### Requirement: Frontend sends the browser hour cycle
The frontend SHALL send `hour12` with every report request, detected from the browser locale at request time. It SHALL NOT store it in saved form state.

#### Scenario: Request payload
- **WHEN** an en-US browser requests a report
- **THEN** the request body contains `"hour12": true`
