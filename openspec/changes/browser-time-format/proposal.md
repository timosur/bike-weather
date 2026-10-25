# Proposal

## Why

Native time inputs follow the browser locale (e.g. "05:00 PM" in en-US), but the planner timeline and the report always show 24-hour times ("17:00"). A US-locale user sees both formats on one page.

## What Changes

- All displayed times follow the **browser locale's hour cycle** (12 h or 24 h), not the app language. This covers the planner timeline, report ride windows, chart axes and tooltips, and sunrise/sunset.
- The frontend sends `hour12` (detected from the browser) with each report request. The backend uses it for times inside generated text: leg labels ("Leg 2 · 5:00 PM"), the early-departure tip, and light reasons ("Start at 6:30 AM before sunrise (7:12 AM)").
- Stored and transmitted time values stay `HH:MM` (24 h). Only display changes.

## Capabilities

### New Capabilities

- `time-display`: how times are formatted for display in the planner and the report.

### Modified Capabilities

_None._

## Out of Scope

- An in-app setting to choose the format.
- Native time inputs (already browser-controlled).
- Shared reports viewed in another locale. Generated text keeps the creator's format; frontend-rendered times use the viewer's.
- Date formatting.

## Impact

- **Frontend:** new `lib/timeFormat.ts`; `RideTimelinePreview`, `RideReport`, `RideWindowInfo`, `DayTimeline`, `WeatherChart`, `MultiDayWeatherChart`, `WeatherPanel`; `api/rides.ts` (`hour12` on report requests).
- **Backend:** `RideInputSchema.hour12` (optional, default `false`); a time formatting helper; leg label, early-departure tip and light reasons use it.
- **API:** one new optional request field; old clients keep 24 h.
