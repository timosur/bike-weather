# Milestone 4: Weather + Recommendation Engine

## What

The core feature — POST /api/rides/report fetches live weather from Open-Meteo, runs the rule-based recommendation engine, returns a complete RideReport.

## Backend files

- `backend/app/schemas/ride.py` — RideInputSchema matching frontend RideInput
- `backend/app/schemas/report.py` — RideReportSchema, DayForecastSchema, WeatherDataSchema, ClothingItemSchema, EquipmentItemSchema (mirrors frontend types)
- `backend/app/services/weather.py`:
  - fetch_forecast(lat, lon, date) → calls Open-Meteo API
  - WMO weather code → WeatherIconType mapping
  - In-memory cache (30min TTL, keyed by lat/lon/date)
  - Extracts: temp min/max, feels-like (avg daytime apparent_temperature), precip %, wind speed/direction, UV, sunrise/sunset, humidity
- `backend/app/rules/clothing_rules.py`:
  - get_clothing_items(weather, bike_type, intensity) → ClothingItem[]
  - Temperature bands: <0°C, 0-5, 5-10, 10-15, 15-20, >20°C → base/mid/outer layers
  - Precipitation modifiers: >20% → packable rain jacket, >50% → full rain gear
  - Wind modifiers: >15 km/h → wind vest, >30 → full wind jacket
  - Each item includes: id, name, icon, reason (with actual weather values), alternatives
- `backend/app/rules/equipment_rules.py`:
  - get_equipment_items(weather, distance, sunrise, sunset) → EquipmentItem[]
  - >30km → repair kit, UV≥3 → sunscreen, near sunset → lights, >50% precip → mudguards+dry bag, >50km → energy bars, always → water bottle, <5°C → warm drink
- `backend/app/rules/condition.py`:
  - compute_condition(weather) → ConditionRating
  - ideal: dry(<20%) + 12-22°C + wind<15
  - good: dry(<20%) + 5-25°C + wind<30
  - caution: precip>50% OR <5°C OR wind>30
  - not-recommended: thunderstorm OR snow OR <-5°C OR wind>50
- `backend/app/services/recommendations.py`:
  - Orchestrator: takes RideInput → geocode if needed → fetch weather per day → run rules → assemble RideReport
  - Overall condition: worst condition across all days
- `backend/app/api/routes/rides.py`:
  - `POST /api/rides/report` — accepts RideInputSchema body, optional route_id query param

## Frontend files

- New `frontend/src/api/rides.ts` — fetchReport(rideInput, routeId?): Promise<RideReport>
- Modify `frontend/src/pages/ReportPage.tsx`:
  - Remove sampleReport (~160 lines) and buildReportFromInput() function
  - Add useState for report/loading/error
  - useEffect: call fetchReport(rideInput) on mount → set report
  - Loading spinner while fetching, error state with retry
  - Products: keep existing sampleProducts import for inline product links (will switch to API later with auth routes)

## Implementation guidelines

- **Weather service**: Design as a standalone module with dependency injection for the HTTP client. The in-memory cache should use a simple dict with TTL check — no need for Redis at this stage.
- **Rule modules must be pure functions**: Take weather data in, return items out. No DB, no HTTP, no side effects. This makes them trivially testable.
- **Use dataclasses or Pydantic models for internal weather data** passed between services/rules — not raw dicts.
- **The orchestrator** (`recommendations.py`) is the only module that coordinates geocoding + weather + rules. Route handler just calls the orchestrator.
- **Open-Meteo errors**: If the weather API is down or returns bad data, return a clear error to the client (503 with retry-after suggestion) rather than crashing.
- **WMO code mapping**: Create a static lookup dict. Cover all codes the Open-Meteo API can return. Fall back to a generic icon for unknown codes.

## Tests

- `tests/test_rules/test_clothing_rules.py` (unit — pure functions, no mocks needed):
  - `test_freezing_weather_includes_thermal_layers` — Temp <0°C produces thermal base layer, insulated jacket, etc.
  - `test_warm_weather_minimal_clothing` — Temp >20°C produces jersey and shorts.
  - `test_rain_adds_rain_gear` — Precip >50% adds full rain gear.
  - `test_light_rain_adds_packable_jacket` — Precip 20-50% adds packable rain jacket.
  - `test_wind_adds_wind_protection` — Wind >30 km/h adds wind jacket.
  - `test_each_item_has_reason_with_values` — Every returned item has a non-empty reason string containing actual weather values.
  - `test_temperature_bands_are_complete` — Test each band boundary: <0, 0-5, 5-10, 10-15, 15-20, >20.
- `tests/test_rules/test_equipment_rules.py` (unit):
  - `test_long_ride_includes_repair_kit` — Distance >30km adds repair kit.
  - `test_high_uv_includes_sunscreen` — UV ≥3 adds sunscreen.
  - `test_evening_ride_includes_lights` — Ride time near sunset adds lights.
  - `test_rainy_ride_includes_mudguards` — Precip >50% adds mudguards and dry bag.
  - `test_always_includes_water` — Water bottle is always present.
  - `test_cold_includes_warm_drink` — Temp <5°C adds warm drink.
- `tests/test_rules/test_condition.py` (unit):
  - `test_ideal_conditions` — Dry, 15°C, low wind → "ideal".
  - `test_good_conditions` — Dry, 8°C, moderate wind → "good".
  - `test_caution_high_precip` — Precip >50% → "caution".
  - `test_caution_cold` — Temp <5°C → "caution".
  - `test_not_recommended_thunderstorm` — Thunderstorm code → "not-recommended".
  - `test_not_recommended_extreme_cold` — Temp <-5°C → "not-recommended".
- `tests/test_services/test_weather.py` (unit — mock httpx):
  - `test_fetch_forecast_parses_response` — Given mock Open-Meteo JSON, returns structured weather data.
  - `test_fetch_forecast_caches_result` — Second call with same params returns cached result without HTTP call.
  - `test_fetch_forecast_cache_expires` — After TTL, a new HTTP call is made.
  - `test_fetch_forecast_api_error_raises` — Open-Meteo 500 raises an appropriate service exception.
  - `test_wmo_code_mapping_covers_all_codes` — All WMO codes used by Open-Meteo map to a valid icon type.
- `tests/test_services/test_recommendations.py` (unit — mock weather + geocoding services):
  - `test_single_day_report_structure` — Returns complete RideReport with one day forecast.
  - `test_multi_day_report_has_per_day_forecasts` — Multi-day input produces one forecast per day.
  - `test_overall_condition_is_worst` — If one day is "caution" and another is "good", overall is "caution".
- `tests/test_api/test_rides.py` (integration — mock external HTTP only):
  - `test_report_endpoint_returns_valid_report` — POST /api/rides/report with valid input returns 200 with RideReport shape.
  - `test_report_endpoint_invalid_input_returns_422` — Missing required fields return 422.
  - `test_report_endpoint_weather_unavailable_returns_503` — When weather API is down, returns 503.

## Verify

- Plan a ride in Konstanz → get live weather for today
- Plan a cold-weather ride → see thermal layers recommended
- Plan a rainy-day ride → see rain gear recommended
- Plan a multi-day ride → see per-day weather and recommendations
- Check different locations/dates → recommendations vary correctly
- `pytest` passes all tests (including M1–M3)
