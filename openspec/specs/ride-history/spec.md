# ride-history Specification

## Purpose
Keeps a local, per-browser list of recently planned rides so users can quickly re-plan a known ride from the planner without re-entering route and ride parameters.

## Requirements

### Requirement: Record planned rides
The system SHALL add an entry to the local ride history when a report is successfully fetched for a new ride (not a saved route and not an edit). The history SHALL keep at most 10 entries, newest first.

#### Scenario: New ride is recorded
- **WHEN** the user submits a new ride and the report loads successfully
- **THEN** the ride appears as the first entry in the recent rides list

#### Scenario: Limit is enforced
- **WHEN** a new ride is recorded while 10 entries exist
- **THEN** the oldest entry is dropped and 10 entries remain

#### Scenario: Failed report is not recorded
- **WHEN** the report request fails
- **THEN** no history entry is added

### Requirement: Deduplicate identical rides
The system SHALL treat two rides as identical when start location, destination, waypoints (in order) and bike type match. Recording an identical ride SHALL remove the older entry and place the new entry first.

#### Scenario: Same ride submitted again
- **WHEN** the user submits a ride identical to an existing history entry
- **THEN** the history contains one entry for that ride, at the top, with the new last-used date

#### Scenario: Different bike type is a different ride
- **WHEN** the user submits the same route with a different bike type
- **THEN** both entries remain in the history

### Requirement: Recent rides list display
The planner SHALL show the 3 most recent entries and a control to reveal the remaining entries. Each entry SHALL show start location, destination (if any), distance (if known), bike type and the date it was last used. Entries SHALL NOT show a weather condition rating.

#### Scenario: More than 3 entries
- **WHEN** the history contains 5 entries
- **THEN** 3 entries are visible and a "show more" control reveals the other 2

#### Scenario: No weather rating
- **WHEN** an entry is displayed
- **THEN** it shows no condition badge (ideal/good/caution/not recommended)

#### Scenario: Empty history
- **WHEN** the history is empty
- **THEN** the recent rides section is not shown

### Requirement: Remove and clear entries
The user SHALL be able to remove a single entry and to clear the whole history.

#### Scenario: Remove one entry
- **WHEN** the user removes an entry
- **THEN** only that entry disappears from the list and does not reappear after reload

#### Scenario: Clear history
- **WHEN** the user clears the history
- **THEN** the recent rides section disappears and stays empty after reload

### Requirement: Selecting an entry pre-fills the form
Selecting a history entry SHALL load its ride parameters into the planner form without submitting it and without adding a history entry. The planner SHALL indicate that the form was loaded from ride history.

#### Scenario: Select loads form
- **WHEN** the user selects a history entry
- **THEN** the form shows the entry's start, destination, waypoints, bike type, intensity and optional parameters
- **AND** no report request is made
- **AND** a banner states the form was loaded from ride history

### Requirement: Past date/time defaults to now
When the selected entry's start date and time lie in the past, the form SHALL use today's date and the current time instead. A start date and time in the future SHALL be kept unchanged.

#### Scenario: Past ride
- **WHEN** the user selects an entry whose start date/time is before now
- **THEN** the form's date is today and its time is the current time

#### Scenario: Future ride
- **WHEN** the user selects an entry whose start date/time is after now
- **THEN** the form's date and time equal the entry's original values

### Requirement: Toggle between original and current date/time
When the date/time was replaced with now, the history banner SHALL offer a control to switch to the entry's original date/time, and from there back to now. Other form values SHALL be unaffected by the toggle. The control SHALL NOT be shown when the original date/time was kept.

#### Scenario: Switch to original
- **WHEN** the form was set to now and the user activates "Use original date"
- **THEN** the form's date and time change to the entry's original values and the control changes to "Use now"

#### Scenario: Switch back to now
- **WHEN** the user activates "Use now"
- **THEN** the form's date and time change to today and the current time

#### Scenario: Edits survive the toggle
- **WHEN** the user changed the bike type and then toggles the date
- **THEN** the changed bike type is kept

#### Scenario: No toggle for future rides
- **WHEN** the selected entry's date/time was in the future
- **THEN** the banner shows no date toggle
