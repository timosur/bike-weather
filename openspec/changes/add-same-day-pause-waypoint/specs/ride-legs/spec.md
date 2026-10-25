# Spec Delta

## Purpose

Defines how a ride report is split into legs at pause and overnight waypoints, how each leg is timed and forecast along its route, and how per-leg recommendations are combined into one packing list with tips.

## ADDED Requirements

### Requirement: Split ride into legs
A ride with at least one `pause` or `sleep` waypoint SHALL produce one report entry per leg, in route order: start → first split waypoint, between consecutive split waypoints, last split waypoint → destination. `stop` waypoints SHALL NOT split.

#### Scenario: Same-day return trip
- **WHEN** a ride on 2026-10-26 starts at A at `09:00`, has a `pause` at B departing `17:00`, and ends at A
- **THEN** the report has 2 entries, both dated 2026-10-26, starting `09:00` at A and `17:00` at B

#### Scenario: Stops only
- **WHEN** a ride has only `stop` waypoints
- **THEN** the report has a single entry, as before

### Requirement: Leg date
A leg after a `pause` SHALL have the same date as the previous leg. A leg after a `sleep` SHALL be dated one day after the previous leg.

#### Scenario: Mixed pause and sleep
- **WHEN** a ride starting 2026-10-26 has waypoints pause, sleep, pause
- **THEN** the legs are dated 2026-10-26, 2026-10-26, 2026-10-27, 2026-10-27

### Requirement: Per-leg recommendations
Each leg SHALL have its own condition, clothing, equipment and tips, computed from that leg's weather over its riding window (leg start time + estimated duration).

#### Scenario: Cool evening leg
- **WHEN** the morning leg is forecast 18 °C and the evening leg 9 °C
- **THEN** only the evening leg's clothing contains cold-weather items

### Requirement: Along-route weather per leg
When route geometry exists, a leg's hourly chart SHALL show, for each hour, the weather at the route point where the rider is on that leg. The leg's summary, condition and clothing SHALL use the worst case across that leg's route points within its riding window. Points of other legs MUST NOT be included.

#### Scenario: Leg 1 excludes return points
- **WHEN** on A → B (pause) → A, the return half passes a point with heavy rain only in the evening
- **THEN** leg 1's condition is unaffected by that point, and leg 2's condition reflects the rain

#### Scenario: Chart follows position on the leg
- **WHEN** leg 2 starts at B at `17:00` and needs 2 hours
- **THEN** leg 2's chart for `17:00` shows weather near B and for `19:00` weather near A

#### Scenario: No geometry
- **WHEN** a ride has no route geometry
- **THEN** each leg uses the weather at its start location

### Requirement: Continuous timeline per date
For rides with more than one leg, each date's chart SHALL cover 06:00–22:00 (widened to include its ride windows). Legs on the same date SHALL split that range in the middle of the pause, with no repeated or missing hours between them.

#### Scenario: Same-day return trip timeline
- **WHEN** leg 1 rides 09:00–10:00 and leg 2 rides 17:00–18:00 on the same date
- **THEN** leg 1's chart starts at 06:00, leg 2's chart ends at 22:00, and leg 2's first hour directly follows leg 1's last hour

#### Scenario: Overnight days
- **WHEN** legs are separated by a `sleep` waypoint
- **THEN** each leg's chart covers 06:00–22:00

### Requirement: Map arrival times include breaks
Route weather shown on the map SHALL use the estimated time the rider passes each point. That time includes pause and overnight departures (date and time). It is not computed only from the ride start.

#### Scenario: Return segment on the map
- **WHEN** on A → B (pause until `17:00`) → A, a map point lies on the return half
- **THEN** its weather is the forecast for that point after `17:00` on the ride date

#### Scenario: Point after overnight
- **WHEN** a map point lies on the leg after a `sleep` departing `08:00`
- **THEN** its weather is the forecast for the next day after `08:00`

### Requirement: Per-leg duration
When no planned distance is given for a leg, its duration SHALL be estimated from the route distance between its start and end point. A leg's end time SHALL be its start time plus that duration.

#### Scenario: Equal legs on a return trip
- **WHEN** the route A → B (pause) → A is 40 km in total, 20 km each way, and the estimated speed is 20 km/h
- **THEN** each leg's estimated duration is about 60 minutes, not 120

#### Scenario: Planned distance overrides
- **WHEN** a split waypoint provides `plannedKm`
- **THEN** that value is used for the leg's duration instead of the route distance

### Requirement: Leg labels
When a ride contains at least one `pause`, report entries SHALL be labelled "Etappe n · HH:MM" (DE) / "Leg n · HH:MM" (EN), using the leg start time. Rides with only `sleep` splits SHALL keep the "Tag n" / "Day n" labels.

#### Scenario: Labels with pause
- **WHEN** a ride starts at `09:00`, has one pause departing `17:00`, and locale is `de`
- **THEN** the entries are labelled "Etappe 1 · 09:00" and "Etappe 2 · 17:00"

#### Scenario: Labels with sleep only
- **WHEN** a ride has one sleep and locale `en`
- **THEN** the entries are labelled "Day 1" and "Day 2"

### Requirement: Packing list across legs
A ride with more than one leg SHALL have a merged packing list of clothing, equipment and tips across all legs. Items not needed on every leg SHALL name the legs that need them.

#### Scenario: Extra layer noted in list
- **WHEN** a long-sleeve jersey is recommended only for leg 2
- **THEN** the merged packing list contains that jersey with the leg 2 label in its reason

### Requirement: Packing tip for later legs
For each leg after the first that needs clothing items leg 1 does not, the report SHALL include one tip that lists those items, names the leg and states its felt-like temperature. The tip SHALL be in the request locale.

#### Scenario: Cool evening tip
- **WHEN** leg 2 (feels like 9 °C) needs a long-sleeve jersey and leg 1 does not
- **THEN** the tips contain one entry naming the long-sleeve jersey, the leg 2 label and 9 °C

#### Scenario: Same clothing on all legs
- **WHEN** every later leg needs only items leg 1 also needs
- **THEN** no packing tip is added

### Requirement: Early departure warning
When a pause's departure time is earlier than the estimated arrival at that waypoint, the request SHALL be accepted, the next leg SHALL start at the given departure time, and the report SHALL include a warning tip naming the waypoint and the estimated arrival time.

#### Scenario: Departure before estimated arrival
- **WHEN** the estimated arrival at pause B is `12:30` and its departure is `12:00`
- **THEN** the report is returned, leg 2 starts at `12:00`, and a warning tip mentions B and `12:30`

#### Scenario: Departure after arrival
- **WHEN** the estimated arrival at pause B is `11:00` and its departure is `17:00`
- **THEN** no early-departure warning is added
