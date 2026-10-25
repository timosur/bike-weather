# Design

## Context

- Times are passed around as `HH:MM` strings (24 h) everywhere: form, API, report fields.
- Frontend displays them via string interpolation (`${h}:00`, `formatClock`).
- Backend embeds times in text in three places: `DAY_LABELS["leg"]`, `LEG_TIPS["early_departure"]`, and the `eq-lights-*` reasons (`fvars` in `equipment_rules.py`).

## Decisions

### D1: Detect the hour cycle with `Intl`
`lib/timeFormat.ts`:
- `uses12h()` → `new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hour12`. `undefined` is the browser locale, not the i18n language.
- `formatTime('17:00')` → `Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' })` on a fixed date. That gives "5:00 PM" / "17:00".
- `formatHour(17)` → `formatTime('17:00')`, with hours ≥ 24 wrapped (overnight charts).

The formatter is created once at module level.
*Alternative:* derive the format from the i18n language. Rejected: it would disagree with the native inputs, which follow the browser.

### D2: `hour12` as a request flag, not form state
`fetchReport` adds `hour12: uses12h()` to the body. That's not in `RideInput`, so saved routes and history don't carry a stale value. Backend: `RideInputSchema.hour12: bool = False`.

### D3: Backend helper
`format_time(hhmm, hour12)` in `app/rules/translations.py`: `"17:05"` → `"5:05 PM"`; `"00:30"` → `"12:30 AM"`; invalid input is returned unchanged. It's applied to the leg label and early-departure arrival in `recommendations.py`, and to `ride_start`, `ride_end`, `sunrise` and `sunset` in the equipment `fvars` (a new `hour12` param on `get_equipment_items`).

## Risks / Trade-offs

- [12 h chart axis labels are wider ("12:00 PM")] → Labels are every 3 h, and the spacing (~114 px) fits.
- [Tests run in Chromium en-US, so existing e2e assertions with "09:00" break] → Update them to the 12 h form; the unit tests cover both cycles by injecting the locale.
