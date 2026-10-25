# Tasks

## 1. Backend

- [x] 1.1 Write failing tests: `format_time` (17:05 → 5:05 PM, 00:30 → 12:30 AM, 12:00 → 12:00 PM, 24 h passthrough, invalid unchanged); a report with `hour12: true` labels "Leg 2 · 5:00 PM" while `rideStartTime` stays "17:00"; an early-departure tip in 12 h; a lights reason in 12 h; default `hour12` omitted keeps 24 h. Verify they fail.
- [x] 1.2 Add `RideInputSchema.hour12`, `format_time`, and apply it in `recommendations.py` and `equipment_rules.py` (D3). Verify 1.1 passes and the backend suite has no new failures.

## 2. Frontend

- [x] 2.1 Write failing Vitest tests for `lib/timeFormat.ts` (`formatTime`, `formatHour` incl. ≥ 24 wrap) with injected `en-US` and `de-DE` locales. Implement it (D1). Verify they pass.
- [x] 2.2 Send `hour12` in `fetchReport` (D2) and use `formatTime`/`formatHour` in `RideTimelinePreview`, `RideReport`, `RideWindowInfo`, `DayTimeline`, `WeatherChart`, `MultiDayWeatherChart` and `WeatherPanel`. Add an e2e assertion that the report request contains `hour12: true` (Chromium en-US) and the timeline shows "9:00 AM". Update existing e2e time assertions. Verify the build, unit tests and full Playwright suite (no new failures beyond the known 8). _(Unit: 18 passed. Playwright: 132 passed, the same 8 old failures, plus a `de-DE` browser test that shows 24 h. 24 h locales pad the hour ("09:00"), like the native input. The timeline time column was widened for "~10:00 AM".)_

## 3. Docs

- [x] 3.1 Document `hour12` in `project/ARCHITECTURE.md` (Ride Report section). Re-read to verify.
