# Spec Delta

## Purpose

Defines the waypoint types a cyclist can place between start and destination (stop, pause, sleep), the inputs each type requires in the ride planner, and how they are validated.

## ADDED Requirements

### Requirement: Waypoint types
A waypoint SHALL have exactly one type: `stop` (pass-through), `pause` (break with departure later the same day) or `sleep` (overnight, departure the next day). Requests with any other type MUST be rejected with HTTP 422.

#### Scenario: Pause waypoint accepted
- **WHEN** a ride request contains a waypoint with `type: "pause"` and `startTime: "17:00"`
- **THEN** the request is accepted and a report is returned

#### Scenario: Unknown type rejected
- **WHEN** a ride request contains a waypoint with `type: "lunch"`
- **THEN** the API responds with HTTP 422

### Requirement: Pause departure time required
A `pause` waypoint SHALL carry a departure time in `HH:MM` format. A pause without a valid `startTime` MUST be rejected with HTTP 422.

#### Scenario: Missing departure time
- **WHEN** a ride request contains a `pause` waypoint without `startTime`
- **THEN** the API responds with HTTP 422

#### Scenario: Malformed departure time
- **WHEN** a `pause` waypoint has `startTime: "5pm"`
- **THEN** the API responds with HTTP 422

### Requirement: Pause departure after leg start
A pause's departure time SHALL be later than the start time of the leg that ends at that pause. Otherwise the request MUST be rejected with HTTP 422 and an error message naming the waypoint.

#### Scenario: Departure before ride start
- **WHEN** the ride starts at `09:00` and the first waypoint is a `pause` with `startTime: "08:30"`
- **THEN** the API responds with HTTP 422

#### Scenario: Two pauses in order
- **WHEN** the ride starts at `08:00` with pauses departing at `12:00` and then `17:00`
- **THEN** the request is accepted

#### Scenario: Pause after overnight
- **WHEN** a `sleep` waypoint departs at `08:00` the next day and a later `pause` departs at `14:00`
- **THEN** the request is accepted (the pause is compared to the `08:00` leg start, not the ride start)

### Requirement: Pause option in the planner
The planner waypoint type toggle SHALL offer Stop, Pause and Overnight. Selecting Pause SHALL show a departure-time input defaulting to `17:00`. Switching a pause to Stop SHALL remove its departure time. Labels SHALL exist in DE and EN.

#### Scenario: Selecting pause
- **WHEN** the user switches a waypoint's type to Pause
- **THEN** a "Departure at" time input with `17:00` appears and the submitted waypoint has `type: "pause"` and `startTime: "17:00"`

#### Scenario: Switching back to stop
- **WHEN** the user switches a pause waypoint back to Stop
- **THEN** the submitted waypoint has `type: "stop"` and no `startTime`

#### Scenario: Riding-days hint unaffected
- **WHEN** the waypoints contain one pause and no sleep
- **THEN** no "riding days" hint is shown

### Requirement: Pause survives route reversal
Reversing the route direction SHALL keep each pause's type and departure time attached to its waypoint.

#### Scenario: Reverse with pause
- **WHEN** the route is A → B (pause 17:00) → C and the user clicks swap
- **THEN** the route becomes C → B (pause 17:00) → A

### Requirement: Pause marker on the report map
The report map SHALL show pause waypoints with a distinct marker and label separate from stop and overnight.

#### Scenario: Pause marker shown
- **WHEN** a report contains a user waypoint of type `pause`
- **THEN** the map shows it with the pause icon and a "Pause" label
