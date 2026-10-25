from unittest.mock import AsyncMock

import httpx
import pytest

from app.schemas.ride import RideInputSchema, RideLocationSchema, DayStopSchema
from app.services.recommendations import build_report
from app.services.weather import WeatherService


MOCK_AIR_QUALITY_RESPONSE = {
    "hourly": {
        "european_aqi": [15.0 + i for i in range(24)],
    }
}


MOCK_AQI_HOURLY = MOCK_AIR_QUALITY_RESPONSE["hourly"]["european_aqi"]


def _make_hourly_response_good() -> dict:
    """Build a mock Open-Meteo hourly+daily response for good weather."""
    hours = 24
    return {
        "hourly": {
            "temperature_2m": [8 + i * 0.5 for i in range(hours)],
            "apparent_temperature": [6 + i * 0.4 for i in range(hours)],
            "precipitation_probability": [10 for _ in range(hours)],
            "precipitation": [0.0 for _ in range(hours)],
            "weather_code": [1 for _ in range(hours)],
            "wind_speed_10m": [12 for _ in range(hours)],
            "wind_direction_10m": [180 for _ in range(hours)],
            "wind_gusts_10m": [18 for _ in range(hours)],
            "relative_humidity_2m": [55 for _ in range(hours)],
            "is_day": [0 if i < 6 or i > 20 else 1 for i in range(hours)],
            "uv_index": [0.0 if i < 6 or i > 20 else 3.0 for i in range(hours)],
        },
        "daily": {
            "uv_index_max": [4.0],
            "sunrise": ["2026-03-15T06:42"],
            "sunset": ["2026-03-15T18:31"],
        },
    }


def _make_hourly_response_bad() -> dict:
    """Build a mock Open-Meteo hourly+daily response for bad weather."""
    hours = 24
    return {
        "hourly": {
            "temperature_2m": [3 + i * 0.3 for i in range(hours)],
            "apparent_temperature": [0 + i * 0.2 for i in range(hours)],
            "precipitation_probability": [75 for _ in range(hours)],
            "precipitation": [2.0 for _ in range(hours)],
            "weather_code": [63 for _ in range(hours)],
            "wind_speed_10m": [35 for _ in range(hours)],
            "wind_direction_10m": [315 for _ in range(hours)],
            "wind_gusts_10m": [50 for _ in range(hours)],
            "relative_humidity_2m": [85 for _ in range(hours)],
            "is_day": [0 if i < 6 or i > 20 else 1 for i in range(hours)],
            "uv_index": [0.0 if i < 6 or i > 20 else 1.0 for i in range(hours)],
        },
        "daily": {
            "uv_index_max": [1.0],
            "sunrise": ["2026-03-16T06:40"],
            "sunset": ["2026-03-16T18:32"],
        },
    }


def _make_service(responses: list[dict]) -> WeatherService:
    """Create a WeatherService that returns different responses per call."""
    call_idx = 0

    async def handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_idx
        resp = responses[min(call_idx, len(responses) - 1)]
        call_idx += 1
        return httpx.Response(200, json=resp)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    service = WeatherService(client=client)
    service.fetch_air_quality = AsyncMock(return_value=list(MOCK_AQI_HOURLY))
    return service


async def test_single_day_report_structure() -> None:
    ws = _make_service([_make_hourly_response_good()])
    ride_input = RideInputSchema(
        location=RideLocationSchema(address="Konstanz", lat=47.66, lon=9.17),
        startDate="2026-03-15",
        startTime="09:00",
        bikeType="rennrad",
        intensity="moderat",
        distanceKm=40,
    )

    report = await build_report(ride_input, ws=ws, locale="en")
    assert report.rideName == "Konstanz Ride"
    assert report.startLocation == "Konstanz"
    assert len(report.days) == 1
    day = report.days[0]
    assert day.date == "2026-03-15"
    assert day.dayLabel == "Today"
    assert day.weather.tempMin <= day.weather.tempMax
    assert len(day.clothingItems) > 0
    assert len(day.equipment) > 0
    # Hourly forecast is centered on the ride window (~16h display)
    assert len(day.hourlyForecast) > 0
    assert len(day.hourlyForecast) <= 24
    # First hour should not be 00:00 (centered around ride start)
    first_hour = int(day.hourlyForecast[0].hour.split(":")[0])
    last_hour = int(day.hourlyForecast[-1].hour.split(":")[0])
    assert first_hour <= day.rideStartHour
    assert last_hour >= day.rideEndHour
    # Ride window should be marked
    assert day.rideStartHour == 9
    assert day.rideEndHour > 9


async def test_multi_day_report_has_per_day_forecasts() -> None:
    ws = _make_service([_make_hourly_response_good(), _make_hourly_response_bad()])
    ride_input = RideInputSchema(
        location=RideLocationSchema(address="Konstanz", lat=47.66, lon=9.17),
        startDate="2026-03-15",
        startTime="09:00",
        bikeType="rennrad",
        intensity="moderat",
        distanceKm=120,
        isMultiDay=True,
        dayStops=[
            DayStopSchema(
                location=RideLocationSchema(
                    address="\u00dcberlingen", lat=47.77, lon=9.16
                )
            ),
        ],
    )

    report = await build_report(ride_input, ws=ws, locale="en")
    assert len(report.days) == 2
    assert report.days[0].location == "Konstanz"
    assert report.days[1].location == "\u00dcberlingen"
    assert report.days[0].dayLabel == "Day 1"
    assert report.days[1].dayLabel == "Day 2"
    # Both days should have centered hourly data around ride window
    assert len(report.days[0].hourlyForecast) > 0
    assert len(report.days[0].hourlyForecast) <= 24
    assert len(report.days[1].hourlyForecast) > 0
    assert len(report.days[1].hourlyForecast) <= 24


async def test_overall_condition_is_worst() -> None:
    ws = _make_service([_make_hourly_response_good(), _make_hourly_response_bad()])
    ride_input = RideInputSchema(
        location=RideLocationSchema(address="Konstanz", lat=47.66, lon=9.17),
        startDate="2026-03-15",
        startTime="09:00",
        bikeType="rennrad",
        intensity="moderat",
        isMultiDay=True,
        dayStops=[
            DayStopSchema(
                location=RideLocationSchema(
                    address="\u00dcberlingen", lat=47.77, lon=9.16
                )
            ),
        ],
    )

    report = await build_report(ride_input, ws=ws)
    # Day 1 good weather \u2192 good/ideal, Day 2 bad weather \u2192 caution
    # Overall should be caution
    assert report.overallCondition == "caution"


async def test_duration_from_input_controls_window() -> None:
    ws = _make_service([_make_hourly_response_good()])
    ride_input = RideInputSchema(
        location=RideLocationSchema(address="Konstanz", lat=47.66, lon=9.17),
        startDate="2026-03-15",
        startTime="08:00",
        bikeType="gravel",
        intensity="moderat",
        durationMinutes=180,  # 3 hours
    )

    report = await build_report(ride_input, ws=ws)
    day = report.days[0]
    # Hourly data centered on ride window
    assert len(day.hourlyForecast) > 0
    assert len(day.hourlyForecast) <= 24
    # Ride window: 08:00 to 11:00 (3 hours = ceil(180/60) = 3h window)
    assert day.rideStartHour == 8
    assert day.rideEndHour == 11


async def test_average_speed_controls_window() -> None:
    ws = _make_service([_make_hourly_response_good()])
    ride_input = RideInputSchema(
        location=RideLocationSchema(address="Konstanz", lat=47.66, lon=9.17),
        startDate="2026-03-15",
        startTime="10:00",
        bikeType="gravel",
        intensity="moderat",
        distanceKm=60,
        averageSpeedKmh=20,  # 60km / 20kmh = 3h
    )

    report = await build_report(ride_input, ws=ws)
    day = report.days[0]
    assert day.rideStartHour == 10
    assert day.rideEndHour == 13  # 10 + ceil(180/60) = 13


# --- Legs (pause / sleep split) -------------------------------------------

# Straight east-west line at Lake Constance (non-zero coords: 0.0 reads as unset)
OUT = [[47.0, 9.0 + i / 100] for i in range(21)]  # A → B, ~15 km
OUT_AND_BACK = OUT + OUT[-2::-1]  # A → B → A
A = {"address": "A", "lat": 47.0, "lon": 9.0}
B = {"address": "B", "lat": 47.0, "lon": 9.2}


def _weather_by(fn) -> tuple[WeatherService, list[httpx.Request]]:
    """WeatherService whose response is fn(hour, lat, lon, date) -> (temp, precip_prob)."""
    requests: list[httpx.Request] = []

    async def handler(request: httpx.Request) -> httpx.Response:
        requests.append(request)
        p = request.url.params
        lat, lon, date = float(p["latitude"]), float(p["longitude"]), p["start_date"]
        values = [fn(h, lat, lon, date) for h in range(24)]
        resp = _make_hourly_response_good()
        resp["hourly"]["temperature_2m"] = [t for t, _ in values]
        resp["hourly"]["apparent_temperature"] = [t for t, _ in values]
        resp["hourly"]["precipitation_probability"] = [pp for _, pp in values]
        resp["hourly"]["weather_code"] = [63 if pp >= 50 else 1 for _, pp in values]
        resp["daily"]["sunrise"] = [f"{date}T07:00"]
        resp["daily"]["sunset"] = [f"{date}T18:00"]
        return httpx.Response(200, json=resp)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    service = WeatherService(client=client)
    service.fetch_air_quality = AsyncMock(return_value=list(MOCK_AQI_HOURLY))
    return service, requests


def _ride(waypoints: list[dict], geometry=OUT_AND_BACK, dest=A, **extra):
    return RideInputSchema(
        location=A,
        destination=dest,
        startDate="2026-10-26",
        startTime="09:00",
        bikeType="rennrad",
        intensity="moderat",
        durationMinutes=120,
        importedGeometry=geometry,
        waypoints=waypoints,
        **extra,
    )


PAUSE_AT_B = {"location": B, "type": "pause", "startTime": "17:00"}
MILD = lambda h, lat, lon, date: (15.0, 10)  # noqa: E731


async def test_pause_return_trip_gives_two_same_date_legs() -> None:
    ws, _ = _weather_by(MILD)
    report = await build_report(_ride([PAUSE_AT_B]), ws=ws, locale="en")

    assert [d.date for d in report.days] == ["2026-10-26", "2026-10-26"]
    assert [d.rideStartTime for d in report.days] == ["09:00", "17:00"]
    assert [d.dayLabel for d in report.days] == ["Leg 1 · 09:00", "Leg 2 · 17:00"]
    assert [d.location for d in report.days] == ["A", "B"]
    assert [d.estimatedDurationMinutes for d in report.days] == [60, 60]
    assert [d.rideEndTime for d in report.days] == ["10:00", "18:00"]


async def test_leg_labels_german() -> None:
    ws, _ = _weather_by(MILD)
    report = await build_report(_ride([PAUSE_AT_B]), ws=ws, locale="de")
    assert [d.dayLabel for d in report.days] == ["Etappe 1 · 09:00", "Etappe 2 · 17:00"]


async def test_pause_sleep_pause_dates() -> None:
    ws, _ = _weather_by(MILD)
    pts = [{"lat": 47.0, "lon": 9.0 + x / 100} for x in (5, 10, 15)]
    ride = _ride(
        [
            {"location": pts[0], "type": "pause", "startTime": "12:00"},
            {"location": pts[1], "type": "sleep", "startTime": "08:30"},
            {"location": pts[2], "type": "pause", "startTime": "14:00"},
        ],
        geometry=OUT,
        dest=B,
    )
    report = await build_report(ride, ws=ws, locale="en")
    assert [d.date for d in report.days] == [
        "2026-10-26",
        "2026-10-26",
        "2026-10-27",
        "2026-10-27",
    ]


async def test_merged_clothing_notes_leg_for_cold_evening() -> None:
    ws, _ = _weather_by(lambda h, lat, lon, date: (20.0 if h < 15 else 2.0, 10))
    report = await build_report(_ride([PAUSE_AT_B]), ws=ws, locale="en")

    leg1_ids = {c.id for c in report.days[0].clothingItems}
    evening_only = [c for c in report.days[1].clothingItems if c.id not in leg1_ids]
    assert evening_only, "cold evening should need extra clothing"
    merged = {c.id: c for c in report.mergedClothingItems}
    assert merged[evening_only[0].id].reason.endswith("(Leg 2 · 17:00)")


async def test_leg_one_ignores_rain_on_return_half() -> None:
    # A → B → C: rain only north of the A–B line (the B → C half)
    geometry = OUT + [[47.0 + i / 100, 9.2] for i in range(1, 21)]
    ws, _ = _weather_by(lambda h, lat, lon, date: (15.0, 90 if lat > 47.05 else 5))
    ride = _ride([PAUSE_AT_B], geometry=geometry, dest={"lat": 47.2, "lon": 9.2})
    report = await build_report(ride, ws=ws, locale="en")

    assert report.days[0].weather.precipitation <= 10
    assert report.days[1].weather.precipitation >= 90


async def test_leg_chart_follows_position_on_leg() -> None:
    # Temperature encodes longitude: B (lon 9.2) = 30 °C, A (lon 9.0) = 10 °C
    ws, _ = _weather_by(lambda h, lat, lon, date: (10.0 + (lon - 9.0) * 100, 10))
    report = await build_report(_ride([PAUSE_AT_B]), ws=ws, locale="en")

    chart = {h.hour: h.temp for h in report.days[1].hourlyForecast}
    assert chart["17:00"] == pytest.approx(30.0, abs=1)
    assert chart["19:00"] == pytest.approx(10.0, abs=1)


async def test_same_day_pause_adds_at_most_one_weather_call() -> None:
    ws_stop, stop_requests = _weather_by(MILD)
    await build_report(
        _ride([{"location": B, "type": "stop"}]), ws=ws_stop, locale="en"
    )
    ws_pause, pause_requests = _weather_by(MILD)
    await build_report(_ride([PAUSE_AT_B]), ws=ws_pause, locale="en")

    # Only the pause location's own forecast is extra
    assert len(pause_requests) <= len(stop_requests) + 1


async def test_map_weather_on_return_half_uses_evening_hour() -> None:
    ws, _ = _weather_by(MILD)
    calls: list[tuple] = []
    original = ws.fetch_hourly_forecast

    async def spy(lat, lon, date, start_hour, end_hour, *args, **kwargs):
        calls.append((date, start_hour, end_hour))
        return await original(lat, lon, date, start_hour, end_hour, *args, **kwargs)

    ws.fetch_hourly_forecast = spy
    await build_report(_ride([PAUSE_AT_B]), ws=ws, locale="en")

    # Map route weather is fetched for a single hour per point
    map_hours = sorted(start for _, start, end in calls if start == end)
    assert map_hours[0] == 9
    assert map_hours[-1] >= 17


COLD_EVENING = lambda h, lat, lon, date: (20.0 if h < 15 else 2.0, 10)  # noqa: E731


def _tips(report, prefix: str):
    return [t for t in report.tips if t.id.startswith(prefix)]


async def test_packing_tip_for_cold_evening_leg_en() -> None:
    ws, _ = _weather_by(COLD_EVENING)
    report = await build_report(_ride([PAUSE_AT_B]), ws=ws, locale="en")

    tips = _tips(report, "pack-leg-")
    assert [t.id for t in tips] == ["pack-leg-2"]
    leg1_ids = {c.id for c in report.days[0].clothingItems}
    extra = next(c for c in report.days[1].clothingItems if c.id not in leg1_ids)
    assert extra.name in tips[0].message
    assert "Leg 2 · 17:00" in tips[0].message
    assert "cooler" in tips[0].message
    assert "2 °C" in tips[0].message


async def test_packing_tip_german() -> None:
    ws, _ = _weather_by(COLD_EVENING)
    report = await build_report(_ride([PAUSE_AT_B]), ws=ws, locale="de")

    (tip,) = _tips(report, "pack-leg-")
    assert tip.message.startswith("Pack noch")
    assert "Etappe 2 · 17:00" in tip.message


async def test_no_packing_tip_when_legs_need_same_clothing() -> None:
    ws, _ = _weather_by(MILD)
    report = await build_report(_ride([PAUSE_AT_B]), ws=ws, locale="en")
    assert _tips(report, "pack-leg-") == []


async def test_early_departure_warning() -> None:
    # Leg 1 takes 60 min from 09:00 → arrival 10:00, but departure is 09:30
    ws, _ = _weather_by(MILD)
    early = {**PAUSE_AT_B, "startTime": "09:30"}
    report = await build_report(_ride([early]), ws=ws, locale="en")

    (tip,) = _tips(report, "early-departure-")
    assert tip.severity == "warning"
    assert "B" in tip.message and "10:00" in tip.message
    assert report.days[1].rideStartTime == "09:30"


async def test_no_early_departure_warning_when_after_arrival() -> None:
    ws, _ = _weather_by(MILD)
    report = await build_report(_ride([PAUSE_AT_B]), ws=ws, locale="en")
    assert _tips(report, "early-departure-") == []


def _hours(day) -> list[int]:
    return [int(h.hour.split(":")[0]) for h in day.hourlyForecast]


async def test_same_day_legs_split_one_continuous_timeline() -> None:
    # Leg 1 rides 09–10, leg 2 rides 17–18 → one 06–22 day split mid-pause
    ws, _ = _weather_by(MILD)
    report = await build_report(_ride([PAUSE_AT_B]), ws=ws, locale="en")

    leg1, leg2 = (_hours(d) for d in report.days)
    assert leg1[0] == 6 and leg2[-1] == 22
    assert leg2[0] == leg1[-1] + 1, "no gap or duplicate hours between legs"
    assert 9 <= leg1[-1] < 17
    assert leg1 == list(range(leg1[0], leg1[-1] + 1))


async def test_overnight_days_keep_full_day_window() -> None:
    ws, _ = _weather_by(MILD)
    sleep_at_b = {"location": B, "type": "sleep", "startTime": "09:00"}
    report = await build_report(_ride([sleep_at_b]), ws=ws, locale="en")

    for day in report.days:
        assert _hours(day)[0] == 6 and _hours(day)[-1] == 22


# --- 12-hour display (hour12) ---------------------------------------------


async def test_hour12_formats_generated_text_but_not_fields() -> None:
    ws, _ = _weather_by(MILD)
    report = await build_report(_ride([PAUSE_AT_B], hour12=True), ws=ws, locale="en")

    assert [d.dayLabel for d in report.days] == ["Leg 1 · 9:00 AM", "Leg 2 · 5:00 PM"]
    assert report.days[1].rideStartTime == "17:00"
    assert report.days[1].hourlyForecast[0].hour.endswith(":00")
    assert len(report.days[1].hourlyForecast[0].hour) == 5  # HH:MM


async def test_hour12_early_departure_tip() -> None:
    ws, _ = _weather_by(MILD)
    early = {**PAUSE_AT_B, "startTime": "09:30"}
    report = await build_report(_ride([early], hour12=True), ws=ws, locale="en")

    (tip,) = _tips(report, "early-departure-")
    assert "10:00 AM" in tip.message


async def test_hour12_lights_reason() -> None:
    # Leg 2 rides 17:00–18:00, sunset at 18:00 → lights reason mentions both times
    ws, _ = _weather_by(MILD)
    report = await build_report(_ride([PAUSE_AT_B], hour12=True), ws=ws, locale="en")

    lights = [e for e in report.days[1].equipment if e.id.startswith("eq-lights")]
    assert lights and "6:00 PM" in lights[0].reason


async def test_hour12_defaults_to_24h() -> None:
    ws, _ = _weather_by(MILD)
    report = await build_report(_ride([PAUSE_AT_B]), ws=ws, locale="en")
    assert report.days[1].dayLabel == "Leg 2 · 17:00"
