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
