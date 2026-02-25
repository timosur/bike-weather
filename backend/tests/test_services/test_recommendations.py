import httpx

from app.schemas.ride import RideInputSchema, RideLocationSchema, DayStopSchema
from app.services.recommendations import build_report
from app.services.weather import WeatherService


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
    return WeatherService(client=client)


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
