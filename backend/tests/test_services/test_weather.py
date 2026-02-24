import time

import httpx
import pytest

from app.services.weather import (
    WMO_CODE_MAP,
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


async def test_fetch_forecast_api_error_raises() -> None:
    client = httpx.AsyncClient(transport=_mock_transport(status_code=500, response_data={"error": "fail"}))
    service = WeatherService(client=client)

    with pytest.raises(WeatherServiceError):
        await service.fetch_forecast(47.66, 9.17, "2026-03-15")


def test_wmo_code_mapping_covers_all_codes() -> None:
    # All codes that Open-Meteo can return
    expected_codes = {0, 1, 2, 3, 45, 48, 51, 53, 55, 56, 57, 61, 63, 65, 66, 67,
                      71, 73, 75, 77, 80, 81, 82, 85, 86, 95, 96, 99}
    valid_icons = {"sun", "cloud-sun", "cloud", "rain", "snow", "thunderstorm", "fog"}
    for code in expected_codes:
        icon = wmo_to_icon(code)
        assert icon in valid_icons, f"WMO code {code} maps to invalid icon '{icon}'"
