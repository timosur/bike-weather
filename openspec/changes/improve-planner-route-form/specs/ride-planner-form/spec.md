# Spec Delta

## Purpose

Defines how the ride planner's route section is laid out and entered: field order, waypoint rows, the live timeline preview, and the back-to-start shortcut for same-day return trips.

## ADDED Requirements

### Requirement: Route section reads in time order
The planner SHALL show the route section in this order: start location, departure date and start time, waypoints, destination, route map, timeline preview.

#### Scenario: Field order
- **WHEN** the planner is opened
- **THEN** the departure date and start time inputs appear directly below the start location and above the waypoints

### Requirement: Departure time inputs are fully readable
Waypoint departure time inputs SHALL show the full time in both 24-hour and 12-hour (AM/PM) formats, on desktop and at 390 px viewport width.

#### Scenario: English 12-hour time
- **WHEN** the UI language is English and a pause departs at 17:00
- **THEN** the input shows "05:00 PM" without truncation

### Requirement: Compact waypoint rows
Each waypoint SHALL be one row with its location, a Stop / Pause / Overnight toggle and a remove button labelled "Remove waypoint" for assistive technology. Pause and overnight rows SHALL show their departure time inline in the same row ("until" for pause, "next day" for overnight); on narrow screens the time MAY wrap to a second line.

#### Scenario: Pause row
- **WHEN** a waypoint is set to Pause
- **THEN** its row shows a departure time input labelled "Departure at", defaulting to 17:00, with no separate panel below the row

#### Scenario: Remove
- **WHEN** the user activates a waypoint's remove button
- **THEN** that waypoint is removed

### Requirement: Optional waypoint name
The waypoint name input SHALL be hidden until the user activates "Add name". A waypoint that already has a name SHALL show the input.

#### Scenario: New waypoint
- **WHEN** a waypoint is added
- **THEN** no name input is shown, and an "Add name" control is

#### Scenario: Loaded waypoint with name
- **WHEN** the form is loaded with a waypoint named "Café Mayer"
- **THEN** the name input is visible with "Café Mayer"

### Requirement: Live timeline preview
When start, destination and a route preview exist, the planner SHALL show a timeline below the map with: start time and place, then for each pause or overnight its estimated arrival and its departure, then the estimated arrival at the destination. Estimated times SHALL be marked as approximate and SHALL update without a new request when times, speed or duration change.

#### Scenario: Same-day return
- **WHEN** start is A at 09:00, a pause at B departs 17:00, destination is A, and each half of the route takes about 60 min
- **THEN** the timeline shows "09:00 A", "~10:00 B", "☕ until 17:00", "~18:00 A"

#### Scenario: Overnight
- **WHEN** an overnight at B departs 08:00
- **THEN** the timeline shows B's departure as next day 08:00

#### Scenario: No route yet
- **WHEN** start or destination is missing
- **THEN** no timeline is shown

### Requirement: Early pause departure is highlighted
If a pause departs before the estimated arrival at that waypoint, the timeline SHALL highlight that entry and say the departure is before the estimated arrival.

#### Scenario: Departure too early
- **WHEN** the estimated arrival at B is ~10:00 and the pause departs at 09:30
- **THEN** the B entry is highlighted with a warning

### Requirement: Back to start shortcut
When start and destination are set and differ, the planner SHALL offer "Back to start" next to the destination. Activating it SHALL append the current destination as a Pause waypoint, set the destination to the start location, prefill the pause departure with the estimated arrival at that waypoint plus 1 hour, rounded up to 15 minutes, and move focus to that departure input.

#### Scenario: Convert A → B into a return trip
- **WHEN** start is A at 09:00, destination is B with ~60 min riding, and the user activates "Back to start"
- **THEN** the waypoints end with B as Pause departing 11:00 (arrival ~10:00 + 1 h), and the destination is A

#### Scenario: Rounding
- **WHEN** the estimated arrival at B is 10:20
- **THEN** the pause departure is prefilled with 11:30 (11:20 rounded up to 15 min)

#### Scenario: Already a round trip
- **WHEN** destination equals start
- **THEN** "Back to start" is not offered

#### Scenario: Arrival unknown
- **WHEN** no route preview is available yet
- **THEN** the pause departure is prefilled with 17:00

### Requirement: Swap control placement
The swap control SHALL sit with the destination row and keep its current behavior (swap start and destination, reverse waypoints).

#### Scenario: Swap after layout change
- **WHEN** the user activates swap
- **THEN** start and destination swap and waypoint order reverses, as before
