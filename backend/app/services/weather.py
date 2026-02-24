import logging
import time
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
CACHE_TTL_SECONDS = 1800  # 30 minutes


# WMO Weather interpretation codes → frontend WeatherIconType
WMO_CODE_MAP: dict[int, tuple[str, str]] = {
    0: ("sun", "Clear sky"),
    1: ("sun", "Mainly clear"),
    2: ("cloud-sun", "Partly cloudy"),
    3: ("cloud", "Overcast"),
    45: ("fog", "Fog"),
    48: ("fog", "Depositing rime fog"),
    51: ("rain", "Light drizzle"),
    53: ("rain", "Moderate drizzle"),
    55: ("rain", "Dense drizzle"),
    56: ("rain", "Light freezing drizzle"),
    57: ("rain", "Dense freezing drizzle"),
    61: ("rain", "Slight rain"),
    63: ("rain", "Moderate rain"),
    65: ("rain", "Heavy rain"),
    66: ("rain", "Light freezing rain"),
    67: ("rain", "Heavy freezing rain"),
    71: ("snow", "Slight snow fall"),
    73: ("snow", "Moderate snow fall"),
    75: ("snow", "Heavy snow fall"),
    77: ("snow", "Snow grains"),
    80: ("rain", "Slight rain showers"),
    81: ("rain", "Moderate rain showers"),
    82: ("rain", "Violent rain showers"),
    85: ("snow", "Slight snow showers"),
    86: ("snow", "Heavy snow showers"),
    95: ("thunderstorm", "Thunderstorm"),
    96: ("thunderstorm", "Thunderstorm with slight hail"),
    99: ("thunderstorm", "Thunderstorm with heavy hail"),
}


def wmo_to_icon(code: int) -> str:
    return WMO_CODE_MAP.get(code, ("cloud", "Unknown"))[0]


def wmo_to_description(code: int) -> str:
    return WMO_CODE_MAP.get(code, ("cloud", "Unknown"))[1]


def _wind_direction_label(degrees: float) -> str:
    directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"]
    idx = round(degrees / 45) % 8
    return directions[idx]


@dataclass
class WeatherForecast:
    temp_min: float
    temp_max: float
    temp_feels_like: float
    precipitation_probability: float  # percentage 0-100
    wind_speed: float  # km/h
    wind_direction: str  # compass label
    humidity: float  # percentage
    uv_index: float
    sunrise: str  # HH:MM
    sunset: str  # HH:MM
    weather_code: int
    icon: str
    description: str


class WeatherServiceError(Exception):
    pass


class WeatherService:
    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client
        self._cache: dict[str, tuple[float, WeatherForecast]] = {}

    def _cache_key(self, lat: float, lon: float, date: str) -> str:
        return f"{lat:.2f},{lon:.2f},{date}"

    def _get_cached(self, key: str) -> WeatherForecast | None:
        if key in self._cache:
            ts, forecast = self._cache[key]
            if time.monotonic() - ts < CACHE_TTL_SECONDS:
                return forecast
            del self._cache[key]
        return None

    async def fetch_forecast(self, lat: float, lon: float, date: str) -> WeatherForecast:
        cache_key = self._cache_key(lat, lon, date)
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        client = self._client
        owns_client = False
        if client is None:
            client = httpx.AsyncClient(timeout=httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=5.0))
            owns_client = True

        try:
            response = await client.get(
                OPEN_METEO_URL,
                params={
                    "latitude": str(lat),
                    "longitude": str(lon),
                    "daily": ",".join([
                        "temperature_2m_max",
                        "temperature_2m_min",
                        "apparent_temperature_max",
                        "apparent_temperature_min",
                        "precipitation_probability_max",
                        "windspeed_10m_max",
                        "winddirection_10m_dominant",
                        "relative_humidity_2m_mean",
                        "uv_index_max",
                        "sunrise",
                        "sunset",
                        "weathercode",
                    ]),
                    "start_date": date,
                    "end_date": date,
                    "timezone": "auto",
                },
            )
            response.raise_for_status()
            data = response.json()
        except httpx.HTTPStatusError as e:
            logger.error("Open-Meteo HTTP error: %s", e)
            raise WeatherServiceError(f"Weather API returned {e.response.status_code}") from e
        except Exception as e:
            logger.error("Open-Meteo request failed: %s", e)
            raise WeatherServiceError("Weather API unavailable") from e
        finally:
            if owns_client:
                await client.aclose()

        try:
            daily = data["daily"]
            idx = 0  # Single day request

            temp_max = daily["temperature_2m_max"][idx]
            temp_min = daily["temperature_2m_min"][idx]
            app_max = daily["apparent_temperature_max"][idx]
            app_min = daily["apparent_temperature_min"][idx]
            feels_like = round((app_max + app_min) / 2, 1)

            precip_prob = daily["precipitation_probability_max"][idx] or 0
            wind_speed = daily["windspeed_10m_max"][idx] or 0
            wind_dir_deg = daily["winddirection_10m_dominant"][idx] or 0
            humidity = daily.get("relative_humidity_2m_mean", [50])[idx] or 50
            uv = daily["uv_index_max"][idx] or 0
            weather_code = daily["weathercode"][idx] or 0

            # Parse sunrise/sunset to HH:MM
            sunrise_raw = daily["sunrise"][idx]  # e.g. "2026-03-15T06:42"
            sunset_raw = daily["sunset"][idx]
            sunrise = sunrise_raw.split("T")[1][:5] if "T" in sunrise_raw else sunrise_raw
            sunset = sunset_raw.split("T")[1][:5] if "T" in sunset_raw else sunset_raw

            forecast = WeatherForecast(
                temp_min=temp_min,
                temp_max=temp_max,
                temp_feels_like=feels_like,
                precipitation_probability=precip_prob,
                wind_speed=wind_speed,
                wind_direction=_wind_direction_label(wind_dir_deg),
                humidity=humidity,
                uv_index=uv,
                sunrise=sunrise,
                sunset=sunset,
                weather_code=weather_code,
                icon=wmo_to_icon(weather_code),
                description=wmo_to_description(weather_code),
            )
        except (KeyError, IndexError, TypeError) as e:
            logger.error("Failed to parse Open-Meteo response: %s", e)
            raise WeatherServiceError("Failed to parse weather data") from e

        self._cache[cache_key] = (time.monotonic(), forecast)
        return forecast


# Module-level singleton
weather_service = WeatherService()
