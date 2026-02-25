import asyncio
import logging
import time
from dataclasses import dataclass

import httpx

logger = logging.getLogger(__name__)

OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
CACHE_TTL_SECONDS = 1800  # 30 minutes
MAX_RETRIES = 3
RETRY_BACKOFF_BASE = 1.0  # seconds
RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


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


def wmo_to_description(code: int, locale: str = "de") -> str:
    from app.rules.translations import get_wmo_description

    return get_wmo_description(code, locale)


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


@dataclass
class HourlyForecast:
    """Weather data for a single hour."""

    hour: str  # HH:MM
    temp: float  # °C
    temp_feels_like: float  # °C
    precipitation_probability: float  # 0-100
    precipitation_mm: float  # mm
    wind_speed: float  # km/h
    wind_direction: str  # compass label
    wind_gusts: float  # km/h
    humidity: float  # %
    weather_code: int
    icon: str
    description: str
    is_day: bool


@dataclass
class HourlyWeatherWindow:
    """Hourly forecast data across the ride window, with an aggregated summary."""

    hours: list[HourlyForecast]
    summary: WeatherForecast  # aggregated worst-case for rules


class WeatherServiceError(Exception):
    pass


class WeatherService:
    def __init__(self, client: httpx.AsyncClient | None = None) -> None:
        self._client = client
        self._cache: dict[str, tuple[float, WeatherForecast]] = {}
        self._hourly_cache: dict[str, tuple[float, HourlyWeatherWindow]] = {}

    def _cache_key(self, lat: float, lon: float, date: str) -> str:
        return f"{lat:.2f},{lon:.2f},{date}"

    def _hourly_cache_key(
        self, lat: float, lon: float, date: str, start_hour: int, end_hour: int
    ) -> str:
        return f"{lat:.2f},{lon:.2f},{date},{start_hour}-{end_hour}"

    def _get_cached(self, key: str) -> WeatherForecast | None:
        if key in self._cache:
            ts, forecast = self._cache[key]
            if time.monotonic() - ts < CACHE_TTL_SECONDS:
                return forecast
            del self._cache[key]
        return None

    async def fetch_forecast(
        self, lat: float, lon: float, date: str
    ) -> WeatherForecast:
        cache_key = self._cache_key(lat, lon, date)
        cached = self._get_cached(cache_key)
        if cached is not None:
            return cached

        client = self._client
        owns_client = False
        if client is None:
            client = httpx.AsyncClient(
                timeout=httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=5.0)
            )
            owns_client = True

        params = {
            "latitude": str(lat),
            "longitude": str(lon),
            "daily": ",".join(
                [
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
                ]
            ),
            "start_date": date,
            "end_date": date,
            "timezone": "auto",
        }

        last_exc: Exception | None = None
        try:
            for attempt in range(MAX_RETRIES):
                try:
                    response = await client.get(OPEN_METEO_URL, params=params)
                    response.raise_for_status()
                    data = response.json()
                    break
                except httpx.HTTPStatusError as e:
                    last_exc = e
                    if (
                        e.response.status_code in RETRYABLE_STATUS_CODES
                        and attempt < MAX_RETRIES - 1
                    ):
                        delay = RETRY_BACKOFF_BASE * (2**attempt)
                        logger.warning(
                            "Open-Meteo returned %s, retrying in %.1fs (attempt %d/%d)",
                            e.response.status_code,
                            delay,
                            attempt + 1,
                            MAX_RETRIES,
                        )
                        await asyncio.sleep(delay)
                        continue
                    logger.error("Open-Meteo HTTP error: %s", e)
                    raise WeatherServiceError(
                        f"Weather API returned {e.response.status_code}"
                    ) from e
                except (httpx.ConnectError, httpx.ReadTimeout) as e:
                    last_exc = e
                    if attempt < MAX_RETRIES - 1:
                        delay = RETRY_BACKOFF_BASE * (2**attempt)
                        logger.warning(
                            "Open-Meteo request failed (%s), retrying in %.1fs (attempt %d/%d)",
                            type(e).__name__,
                            delay,
                            attempt + 1,
                            MAX_RETRIES,
                        )
                        await asyncio.sleep(delay)
                        continue
                    logger.error("Open-Meteo request failed: %s", e)
                    raise WeatherServiceError("Weather API unavailable") from e
            else:
                # All retries exhausted
                logger.error(
                    "Open-Meteo request failed after %d attempts: %s",
                    MAX_RETRIES,
                    last_exc,
                )
                raise WeatherServiceError(
                    "Weather API unavailable after retries"
                ) from last_exc
        except WeatherServiceError:
            raise
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
            sunrise = (
                sunrise_raw.split("T")[1][:5] if "T" in sunrise_raw else sunrise_raw
            )
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

    async def fetch_hourly_forecast(
        self,
        lat: float,
        lon: float,
        date: str,
        start_hour: int,
        end_hour: int,
        locale: str = "de",
    ) -> HourlyWeatherWindow:
        """Fetch hourly forecast for a time window on a given date.

        start_hour and end_hour are 0-23 inclusive.
        Also fetches daily data for UV index, sunrise, sunset.
        """
        end_hour = min(end_hour, 23)
        start_hour = max(start_hour, 0)

        cache_key = self._hourly_cache_key(lat, lon, date, start_hour, end_hour)
        if cache_key in self._hourly_cache:
            ts, cached = self._hourly_cache[cache_key]
            if time.monotonic() - ts < CACHE_TTL_SECONDS:
                return cached
            del self._hourly_cache[cache_key]

        client = self._client
        owns_client = False
        if client is None:
            client = httpx.AsyncClient(
                timeout=httpx.Timeout(connect=5.0, read=10.0, write=5.0, pool=5.0)
            )
            owns_client = True

        params = {
            "latitude": str(lat),
            "longitude": str(lon),
            "hourly": ",".join(
                [
                    "temperature_2m",
                    "apparent_temperature",
                    "precipitation_probability",
                    "precipitation",
                    "weather_code",
                    "wind_speed_10m",
                    "wind_direction_10m",
                    "wind_gusts_10m",
                    "relative_humidity_2m",
                    "is_day",
                ]
            ),
            "daily": ",".join(
                [
                    "uv_index_max",
                    "sunrise",
                    "sunset",
                ]
            ),
            "start_date": date,
            "end_date": date,
            "timezone": "auto",
        }

        last_exc: Exception | None = None
        try:
            for attempt in range(MAX_RETRIES):
                try:
                    response = await client.get(OPEN_METEO_URL, params=params)
                    response.raise_for_status()
                    data = response.json()
                    break
                except httpx.HTTPStatusError as e:
                    last_exc = e
                    if (
                        e.response.status_code in RETRYABLE_STATUS_CODES
                        and attempt < MAX_RETRIES - 1
                    ):
                        delay = RETRY_BACKOFF_BASE * (2**attempt)
                        logger.warning(
                            "Open-Meteo hourly returned %s, retrying in %.1fs (attempt %d/%d)",
                            e.response.status_code,
                            delay,
                            attempt + 1,
                            MAX_RETRIES,
                        )
                        await asyncio.sleep(delay)
                        continue
                    logger.error("Open-Meteo hourly HTTP error: %s", e)
                    raise WeatherServiceError(
                        f"Weather API returned {e.response.status_code}"
                    ) from e
                except (httpx.ConnectError, httpx.ReadTimeout) as e:
                    last_exc = e
                    if attempt < MAX_RETRIES - 1:
                        delay = RETRY_BACKOFF_BASE * (2**attempt)
                        logger.warning(
                            "Open-Meteo hourly request failed (%s), retrying in %.1fs (attempt %d/%d)",
                            type(e).__name__,
                            delay,
                            attempt + 1,
                            MAX_RETRIES,
                        )
                        await asyncio.sleep(delay)
                        continue
                    logger.error("Open-Meteo hourly request failed: %s", e)
                    raise WeatherServiceError("Weather API unavailable") from e
            else:
                logger.error(
                    "Open-Meteo hourly request failed after %d attempts: %s",
                    MAX_RETRIES,
                    last_exc,
                )
                raise WeatherServiceError(
                    "Weather API unavailable after retries"
                ) from last_exc
        except WeatherServiceError:
            raise
        except Exception as e:
            logger.error("Open-Meteo hourly request failed: %s", e)
            raise WeatherServiceError("Weather API unavailable") from e
        finally:
            if owns_client:
                await client.aclose()

        try:
            hourly = data["hourly"]
            daily = data["daily"]

            # Parse daily-only fields
            uv_index = daily["uv_index_max"][0] or 0
            sunrise_raw = daily["sunrise"][0]
            sunset_raw = daily["sunset"][0]
            sunrise = (
                sunrise_raw.split("T")[1][:5] if "T" in sunrise_raw else sunrise_raw
            )
            sunset = sunset_raw.split("T")[1][:5] if "T" in sunset_raw else sunset_raw

            # Build hourly forecast items for the requested window
            hours: list[HourlyForecast] = []
            for i in range(start_hour, end_hour + 1):
                wind_dir_deg = hourly["wind_direction_10m"][i] or 0
                wcode = hourly["weather_code"][i] or 0
                hours.append(
                    HourlyForecast(
                        hour=f"{i:02d}:00",
                        temp=hourly["temperature_2m"][i],
                        temp_feels_like=hourly["apparent_temperature"][i],
                        precipitation_probability=hourly["precipitation_probability"][i]
                        or 0,
                        precipitation_mm=hourly["precipitation"][i] or 0,
                        wind_speed=hourly["wind_speed_10m"][i] or 0,
                        wind_direction=_wind_direction_label(wind_dir_deg),
                        wind_gusts=hourly["wind_gusts_10m"][i] or 0,
                        humidity=hourly["relative_humidity_2m"][i] or 50,
                        weather_code=wcode,
                        icon=wmo_to_icon(wcode),
                        description=wmo_to_description(wcode, locale),
                        is_day=bool(hourly["is_day"][i]),
                    )
                )

            # Aggregate worst-case summary from the hourly window
            temps = [h.temp for h in hours]
            feels = [h.temp_feels_like for h in hours]
            # For clothing: use the minimum feels-like (coldest point)
            worst_feels = round(min(feels), 1) if feels else 0
            worst_precip = (
                max(h.precipitation_probability for h in hours) if hours else 0
            )
            worst_wind = max(h.wind_speed for h in hours) if hours else 0
            worst_humidity = max(h.humidity for h in hours) if hours else 50
            # Worst WMO code: higher codes are generally more severe
            worst_wcode = max(h.weather_code for h in hours) if hours else 0
            # For wind direction, use the direction at peak wind speed
            peak_wind_hour = max(hours, key=lambda h: h.wind_speed) if hours else None
            wind_dir = peak_wind_hour.wind_direction if peak_wind_hour else "N"

            summary = WeatherForecast(
                temp_min=round(min(temps), 1) if temps else 0,
                temp_max=round(max(temps), 1) if temps else 0,
                temp_feels_like=worst_feels,
                precipitation_probability=worst_precip,
                wind_speed=worst_wind,
                wind_direction=wind_dir,
                humidity=worst_humidity,
                uv_index=uv_index,
                sunrise=sunrise,
                sunset=sunset,
                weather_code=worst_wcode,
                icon=wmo_to_icon(worst_wcode),
                description=wmo_to_description(worst_wcode, locale),
            )

            result = HourlyWeatherWindow(hours=hours, summary=summary)
        except (KeyError, IndexError, TypeError) as e:
            logger.error("Failed to parse Open-Meteo hourly response: %s", e)
            raise WeatherServiceError("Failed to parse hourly weather data") from e

        self._hourly_cache[cache_key] = (time.monotonic(), result)
        return result


# Module-level singleton
weather_service = WeatherService()
