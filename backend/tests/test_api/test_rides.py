from unittest.mock import AsyncMock, patch

import httpx
from httpx import AsyncClient

MOCK_WEATHER_RESPONSE = {
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

VALID_RIDE_INPUT = {
    "location": {"address": "Konstanz", "lat": 47.66, "lon": 9.17},
    "startDate": "2026-03-15",
    "startTime": "09:00",
    "bikeType": "rennrad",
    "intensity": "moderat",
    "distanceKm": 40,
    "destination": {"address": "Friedrichshafen", "lat": 47.65, "lon": 9.48},
}


@patch("app.services.recommendations.weather_service")
async def test_report_endpoint_returns_valid_report(
    mock_ws: AsyncMock, async_client: AsyncClient
) -> None:
    from app.services.weather import (
        HourlyForecast,
        HourlyWeatherWindow,
        WeatherForecast,
    )

    summary = WeatherForecast(
        temp_min=8.0,
        temp_max=16.0,
        temp_feels_like=10.5,
        precipitation_probability=10,
        wind_speed=12.0,
        wind_direction="S",
        humidity=55,
        uv_index=4.0,
        sunrise="06:42",
        sunset="18:31",
        weather_code=1,
        icon="sun",
        description="Mainly clear",
    )
    hours = [
        HourlyForecast(
            hour=f"{h:02d}:00",
            temp=5.0 + h * 0.5,
            temp_feels_like=3.0 + h * 0.4,
            precipitation_probability=10,
            precipitation_mm=0.0,
            wind_speed=12.0,
            wind_direction="S",
            wind_gusts=18.0,
            humidity=55,
            weather_code=1,
            icon="sun",
            description="Mainly clear",
            is_day=h >= 6 and h <= 20,
        )
        for h in range(24)
    ]
    mock_ws.fetch_hourly_forecast = AsyncMock(
        return_value=HourlyWeatherWindow(hours=hours, summary=summary)
    )

    response = await async_client.post("/api/rides/report", json=VALID_RIDE_INPUT)
    assert response.status_code == 200
    data = response.json()
    assert "rideName" in data
    assert "days" in data
    assert len(data["days"]) == 1
    day = data["days"][0]
    assert "weather" in day
    assert "clothingItems" in day
    assert "equipment" in day
    # Weather aggregated from ride-window hours (start 09:00)
    assert day["weather"]["tempMin"] > 0
    assert "hourlyForecast" in day
    assert len(day["hourlyForecast"]) == 24
    assert "rideStartHour" in day
    assert "rideEndHour" in day


async def test_report_endpoint_invalid_input_returns_422(
    async_client: AsyncClient,
) -> None:
    response = await async_client.post(
        "/api/rides/report", json={"bikeType": "rennrad"}
    )
    assert response.status_code == 422


@patch("app.services.recommendations.weather_service")
async def test_report_endpoint_weather_unavailable_returns_503(
    mock_ws: AsyncMock, async_client: AsyncClient
) -> None:
    from app.services.weather import WeatherServiceError

    mock_ws.fetch_hourly_forecast = AsyncMock(
        side_effect=WeatherServiceError("API down")
    )

    response = await async_client.post("/api/rides/report", json=VALID_RIDE_INPUT)
    assert response.status_code == 503


def test_schema_backward_compat_day_stops_to_waypoints():
    """Old dayStops + isMultiDay format should auto-migrate to waypoints."""
    from app.schemas.ride import RideInputSchema

    old_input = {
        "location": {"address": "Berlin", "lat": 52.52, "lon": 13.40},
        "startDate": "2026-06-01",
        "startTime": "08:00",
        "bikeType": "gravel",
        "intensity": "moderat",
        "distanceKm": 80,
        "isMultiDay": True,
        "dayStops": [
            {
                "location": {"address": "Leipzig", "lat": 51.34, "lon": 12.37},
                "plannedKm": 90,
                "startTime": "09:00",
            }
        ],
    }
    schema = RideInputSchema(**old_input)
    assert schema.dayStops is None
    assert schema.isMultiDay is None
    assert len(schema.waypoints) == 1
    wp = schema.waypoints[0]
    assert wp.type == "sleep"
    assert wp.location.address == "Leipzig"
    assert wp.plannedKm == 90
    assert wp.startTime == "09:00"


def test_schema_new_waypoints_format():
    """New waypoints format should be accepted directly."""
    from app.schemas.ride import RideInputSchema

    new_input = {
        "location": {"address": "Munich", "lat": 48.14, "lon": 11.58},
        "startDate": "2026-06-01",
        "startTime": "08:00",
        "bikeType": "rennrad",
        "intensity": "sportlich",
        "distanceKm": 120,
        "destination": {"address": "Salzburg", "lat": 47.80, "lon": 13.04},
        "waypoints": [
            {
                "location": {"lat": 47.85, "lon": 12.13},
                "type": "stop",
                "name": "Lunch break",
            },
            {
                "location": {"address": "Rosenheim", "lat": 47.86, "lon": 12.13},
                "type": "sleep",
                "plannedKm": 60,
                "startTime": "08:30",
            },
        ],
    }
    schema = RideInputSchema(**new_input)
    assert len(schema.waypoints) == 2
    assert schema.waypoints[0].type == "stop"
    assert schema.waypoints[0].name == "Lunch break"
    assert schema.waypoints[1].type == "sleep"
    assert schema.waypoints[1].plannedKm == 60
    assert schema.destination is not None
    assert schema.destination.address == "Salzburg"


def test_schema_location_address_optional():
    """RideLocationSchema should accept coordinates without address."""
    from app.schemas.ride import RideLocationSchema

    loc = RideLocationSchema(lat=48.14, lon=11.58)
    assert loc.address is None
    assert loc.lat == 48.14
