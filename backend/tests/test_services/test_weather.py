import time
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from app.services.weather import (
    MAX_RETRIES,
    WMO_CODE_MAP,
    HourlyWeatherWindow,
    WeatherForecast,
    WeatherService,
    WeatherServiceError,
    wmo_to_icon,
)

MOCK_OPEN_METEO_RESPONSE = {
    "daily": {
        "temperature_2m_max": [16.0],
        "temperature_2m_min": [8.0],
        "apparent_temperature_max": [15.0],
        "apparent_temperature_min": [6.0],
        "precipitation_probability_max": [25],
        "windspeed_10m_max": [18.0],
        "winddirection_10m_dominant": [225],
        "relative_humidity_2m_mean": [60],
        "uv_index_max": [4.0],
        "sunrise": ["2026-03-15T06:42"],
        "sunset": ["2026-03-15T18:31"],
        "weathercode": [2],
    }
}


def _make_hourly_response(start_hour: int = 8, end_hour: int = 12) -> dict:
    """Build a mock Open-Meteo response with both hourly and daily data."""
    hours = 24
    return {
        "hourly": {
            "temperature_2m": [5 + i * 0.5 for i in range(hours)],
            "apparent_temperature": [3 + i * 0.4 for i in range(hours)],
            "precipitation_probability": [10 if i < 12 else 40 for i in range(hours)],
            "precipitation": [0.0 if i < 12 else 0.5 for i in range(hours)],
            "weather_code": [1 if i < 12 else 3 for i in range(hours)],
            "wind_speed_10m": [10 + i * 0.3 for i in range(hours)],
            "wind_direction_10m": [180 for _ in range(hours)],
            "wind_gusts_10m": [15 + i * 0.4 for i in range(hours)],
            "relative_humidity_2m": [60 for _ in range(hours)],
            "is_day": [0 if i < 6 or i > 20 else 1 for i in range(hours)],
        },
        "daily": {
            "uv_index_max": [5.0],
            "sunrise": ["2026-03-15T06:42"],
            "sunset": ["2026-03-15T18:31"],
        },
    }


def _mock_transport(response_data=None, status_code: int = 200):
    data = response_data if response_data is not None else MOCK_OPEN_METEO_RESPONSE

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(status_code, json=data)

    return httpx.MockTransport(handler)


async def test_fetch_forecast_parses_response() -> None:
    client = httpx.AsyncClient(transport=_mock_transport())
    service = WeatherService(client=client)

    forecast = await service.fetch_forecast(47.66, 9.17, "2026-03-15")
    assert isinstance(forecast, WeatherForecast)
    assert forecast.temp_min == 8.0
    assert forecast.temp_max == 16.0
    assert forecast.temp_feels_like == 10.5  # (15+6)/2
    assert forecast.precipitation_probability == 25
    assert forecast.wind_speed == 18.0
    assert forecast.wind_direction == "SW"
    assert forecast.humidity == 60
    assert forecast.uv_index == 4.0
    assert forecast.sunrise == "06:42"
    assert forecast.sunset == "18:31"
    assert forecast.icon == "cloud-sun"
    assert forecast.weather_code == 2


async def test_fetch_forecast_caches_result() -> None:
    call_count = 0

    async def counting_handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        call_count += 1
        return httpx.Response(200, json=MOCK_OPEN_METEO_RESPONSE)

    client = httpx.AsyncClient(transport=httpx.MockTransport(counting_handler))
    service = WeatherService(client=client)

    await service.fetch_forecast(47.66, 9.17, "2026-03-15")
    await service.fetch_forecast(47.66, 9.17, "2026-03-15")
    assert call_count == 1


async def test_fetch_forecast_cache_expires() -> None:
    call_count = 0

    async def counting_handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        call_count += 1
        return httpx.Response(200, json=MOCK_OPEN_METEO_RESPONSE)

    client = httpx.AsyncClient(transport=httpx.MockTransport(counting_handler))
    service = WeatherService(client=client)

    await service.fetch_forecast(47.66, 9.17, "2026-03-15")
    # Manually expire the cache
    for key in list(service._cache.keys()):
        ts, forecast = service._cache[key]
        service._cache[key] = (ts - 2000, forecast)

    await service.fetch_forecast(47.66, 9.17, "2026-03-15")
    assert call_count == 2


@patch("app.services.weather.asyncio.sleep", new_callable=AsyncMock)
async def test_fetch_forecast_api_error_raises(mock_sleep) -> None:
    client = httpx.AsyncClient(
        transport=_mock_transport(status_code=500, response_data={"error": "fail"})
    )
    service = WeatherService(client=client)

    with pytest.raises(WeatherServiceError):
        await service.fetch_forecast(47.66, 9.17, "2026-03-15")
    # Should have retried MAX_RETRIES - 1 times before raising
    assert mock_sleep.call_count == MAX_RETRIES - 1


@patch("app.services.weather.asyncio.sleep", new_callable=AsyncMock)
async def test_fetch_forecast_retries_on_504_then_succeeds(mock_sleep) -> None:
    call_count = 0

    async def flaky_handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        call_count += 1
        if call_count < 3:
            return httpx.Response(504, json={"error": "timeout"})
        return httpx.Response(200, json=MOCK_OPEN_METEO_RESPONSE)

    client = httpx.AsyncClient(transport=httpx.MockTransport(flaky_handler))
    service = WeatherService(client=client)

    forecast = await service.fetch_forecast(47.66, 9.17, "2026-03-15")
    assert isinstance(forecast, WeatherForecast)
    assert call_count == 3
    assert mock_sleep.call_count == 2


async def test_fetch_forecast_non_retryable_error_raises_immediately() -> None:
    client = httpx.AsyncClient(
        transport=_mock_transport(
            status_code=400, response_data={"error": "bad request"}
        )
    )
    service = WeatherService(client=client)

    with pytest.raises(WeatherServiceError, match="400"):
        await service.fetch_forecast(47.66, 9.17, "2026-03-15")


def test_wmo_code_mapping_covers_all_codes() -> None:
    # All codes that Open-Meteo can return
    expected_codes = {
        0,
        1,
        2,
        3,
        45,
        48,
        51,
        53,
        55,
        56,
        57,
        61,
        63,
        65,
        66,
        67,
        71,
        73,
        75,
        77,
        80,
        81,
        82,
        85,
        86,
        95,
        96,
        99,
    }
    valid_icons = {"sun", "cloud-sun", "cloud", "rain", "snow", "thunderstorm", "fog"}
    for code in expected_codes:
        icon = wmo_to_icon(code)
        assert icon in valid_icons, f"WMO code {code} maps to invalid icon '{icon}'"


async def test_fetch_hourly_forecast_parses_response() -> None:
    mock_data = _make_hourly_response()

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=mock_data)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    service = WeatherService(client=client)

    result = await service.fetch_hourly_forecast(47.66, 9.17, "2026-03-15", 8, 12)
    assert isinstance(result, HourlyWeatherWindow)
    assert len(result.hours) == 5  # hours 8, 9, 10, 11, 12
    assert result.hours[0].hour == "08:00"
    assert result.hours[-1].hour == "12:00"

    # Summary should be aggregated
    summary = result.summary
    assert summary.temp_min <= summary.temp_max
    assert summary.uv_index == 5.0
    assert summary.sunrise == "06:42"
    assert summary.sunset == "18:31"


async def test_fetch_hourly_forecast_summary_uses_worst_case() -> None:
    mock_data = _make_hourly_response()

    async def handler(request: httpx.Request) -> httpx.Response:
        return httpx.Response(200, json=mock_data)

    client = httpx.AsyncClient(transport=httpx.MockTransport(handler))
    service = WeatherService(client=client)

    result = await service.fetch_hourly_forecast(47.66, 9.17, "2026-03-15", 8, 12)
    summary = result.summary
    hourly_temps = [h.temp for h in result.hours]
    hourly_winds = [h.wind_speed for h in result.hours]

    # Summary temp_min should be the min across hours
    assert summary.temp_min == round(min(hourly_temps), 1)
    assert summary.temp_max == round(max(hourly_temps), 1)
    # Wind should be the max across hours
    assert summary.wind_speed == max(hourly_winds)


async def test_fetch_hourly_forecast_caches_result() -> None:
    call_count = 0
    mock_data = _make_hourly_response()

    async def counting_handler(request: httpx.Request) -> httpx.Response:
        nonlocal call_count
        call_count += 1
        return httpx.Response(200, json=mock_data)

    client = httpx.AsyncClient(transport=httpx.MockTransport(counting_handler))
    service = WeatherService(client=client)

    await service.fetch_hourly_forecast(47.66, 9.17, "2026-03-15", 8, 12)
    await service.fetch_hourly_forecast(47.66, 9.17, "2026-03-15", 8, 12)
    assert call_count == 1
