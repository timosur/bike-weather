"""Compute overall ride condition rating from weather data."""

from app.services.weather import WeatherForecast

# Thunderstorm and snow WMO codes
_THUNDERSTORM_CODES = {95, 96, 99}
_SNOW_CODES = {71, 73, 75, 77, 85, 86}


def compute_condition(weather: WeatherForecast) -> str:
    """Return one of: 'ideal', 'good', 'caution', 'not-recommended'."""

    # Not recommended: thunderstorm, snow, extreme cold, extreme wind
    if weather.weather_code in _THUNDERSTORM_CODES:
        return "not-recommended"
    if weather.weather_code in _SNOW_CODES:
        return "not-recommended"
    if weather.temp_min < -5:
        return "not-recommended"
    if weather.wind_speed > 50:
        return "not-recommended"

    # Caution: high precip, cold, or strong wind
    if weather.precipitation_probability > 50:
        return "caution"
    if weather.temp_min < 5:
        return "caution"
    if weather.wind_speed > 30:
        return "caution"

    # Ideal: dry, comfortable temp, low wind
    if (
        weather.precipitation_probability < 20
        and 12 <= weather.temp_feels_like <= 22
        and weather.wind_speed < 15
    ):
        return "ideal"

    # Good: everything else
    return "good"
