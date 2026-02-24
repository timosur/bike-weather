import httpx

from app.schemas.ride import RideInputSchema, RideLocationSchema, DayStopSchema
from app.services.recommendations import build_report
from app.services.weather import WeatherService

# Mock weather response
MOCK_WEATHER_GOOD = {
    "daily": {
        "temperature_2m_max": [16.0],
        "temperature_2m_min": [8.0],
        "apparent_temperature_max": [15.0],
        "apparent_temperature_min": [6.0],
        "precipitation_probability_max": [10],
        "windspeed_10m_max": [12.0],
        "winddirection_10m_dominant": [180],
        "relative_humidity_2m_mean": [55],
        "uv_index_max": [4.0],
        "sunrise": ["2026-03-15T06:42"],
        "sunset": ["2026-03-15T18:31"],
        "weathercode": [1],
    }
}

MOCK_WEATHER_BAD = {
    "daily": {
        "temperature_2m_max": [8.0],
        "temperature_2m_min": [3.0],
        "apparent_temperature_max": [6.0],
        "apparent_temperature_min": [0.0],
        "precipitation_probability_max": [75],
        "windspeed_10m_max": [35.0],
        "winddirection_10m_dominant": [315],
        "relative_humidity_2m_mean": [85],
        "uv_index_max": [1.0],
        "sunrise": ["2026-03-16T06:40"],
        "sunset": ["2026-03-16T18:32"],
        "weathercode": [63],
    }
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
    ws = _make_service([MOCK_WEATHER_GOOD])
    ride_input = RideInputSchema(
        location=RideLocationSchema(address="Konstanz", lat=47.66, lon=9.17),
        startDate="2026-03-15",
        startTime="09:00",
        bikeType="rennrad",
        intensity="moderat",
        distanceKm=40,
    )

    report = await build_report(ride_input, ws=ws)
    assert report.rideName == "Konstanz Ride"
    assert report.startLocation == "Konstanz"
    assert len(report.days) == 1
    day = report.days[0]
    assert day.date == "2026-03-15"
    assert day.dayLabel == "Today"
    assert day.weather.tempMin == 8.0
    assert day.weather.tempMax == 16.0
    assert len(day.clothingItems) > 0
    assert len(day.equipment) > 0


async def test_multi_day_report_has_per_day_forecasts() -> None:
    ws = _make_service([MOCK_WEATHER_GOOD, MOCK_WEATHER_BAD])
    ride_input = RideInputSchema(
        location=RideLocationSchema(address="Konstanz", lat=47.66, lon=9.17),
        startDate="2026-03-15",
        startTime="09:00",
        bikeType="rennrad",
        intensity="moderat",
        distanceKm=120,
        isMultiDay=True,
        dayStops=[
            DayStopSchema(location=RideLocationSchema(address="Überlingen", lat=47.77, lon=9.16)),
        ],
    )

    report = await build_report(ride_input, ws=ws)
    assert len(report.days) == 2
    assert report.days[0].location == "Konstanz"
    assert report.days[1].location == "Überlingen"
    assert report.days[0].dayLabel == "Day 1"
    assert report.days[1].dayLabel == "Day 2"


async def test_overall_condition_is_worst() -> None:
    ws = _make_service([MOCK_WEATHER_GOOD, MOCK_WEATHER_BAD])
    ride_input = RideInputSchema(
        location=RideLocationSchema(address="Konstanz", lat=47.66, lon=9.17),
        startDate="2026-03-15",
        startTime="09:00",
        bikeType="rennrad",
        intensity="moderat",
        isMultiDay=True,
        dayStops=[
            DayStopSchema(location=RideLocationSchema(address="Überlingen", lat=47.77, lon=9.16)),
        ],
    )

    report = await build_report(ride_input, ws=ws)
    # Day 1 good weather → good/ideal, Day 2 bad weather → caution
    # Overall should be caution
    assert report.overallCondition == "caution"
