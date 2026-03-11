"""Rule-based safety and comfort tips from weather conditions."""

from app.rules.translations import get_tip_translation
from app.services.weather import WeatherForecast


def get_tips(
    weather: WeatherForecast,
    locale: str = "de",
    duration_minutes: float | None = None,
    distance_km: float | None = None,
) -> list[dict]:
    """Return a list of contextual safety/comfort tip dicts."""
    tips: list[dict] = []
    feels = weather.temp_feels_like
    temp_min = weather.temp_min
    precip = weather.precipitation_probability

    # Extreme heat (warning) — check before general heat
    if feels > 35:
        tips.append(
            {
                "id": "tip-extreme-heat",
                "category": "heat",
                "message": get_tip_translation("tip-extreme-heat", locale),
                "severity": "warning",
            }
        )

    # General heat advice
    if feels > 30:
        tips.append(
            {
                "id": "tip-heat",
                "category": "heat",
                "message": get_tip_translation("tip-heat", locale),
                "severity": "info",
            }
        )

    # Ice/slippery warning
    if temp_min <= 2:
        tips.append(
            {
                "id": "tip-ice",
                "category": "safety",
                "message": get_tip_translation("tip-ice", locale),
                "severity": "warning",
            }
        )

    # Visibility in rain
    if precip > 30:
        tips.append(
            {
                "id": "tip-visibility",
                "category": "safety",
                "message": get_tip_translation("tip-visibility", locale),
                "severity": "info",
            }
        )

    # Layering advice for transitional temps
    if 10 <= feels <= 20:
        tips.append(
            {
                "id": "tip-layering",
                "category": "comfort",
                "message": get_tip_translation("tip-layering", locale),
                "severity": "info",
            }
        )

    # Hypothermia risk: cold + wet
    if feels < 10 and precip > 30:
        tips.append(
            {
                "id": "tip-hypothermia",
                "category": "safety",
                "message": get_tip_translation("tip-hypothermia", locale),
                "severity": "warning",
            }
        )

    # Wind endurance: long rides (>2h or >60km) with moderate+ wind
    is_long_ride = (duration_minutes is not None and duration_minutes >= 120) or (
        distance_km is not None and distance_km >= 60
    )
    if is_long_ride and weather.wind_speed > 15:
        tips.append(
            {
                "id": "tip-wind-endurance",
                "category": "comfort",
                "message": get_tip_translation("tip-wind-endurance", locale),
                "severity": "info",
            }
        )

    # Air quality moderate — informational advice
    if weather.air_quality_index > 40:
        tips.append(
            {
                "id": "tip-air-quality-moderate",
                "category": "safety",
                "message": get_tip_translation("tip-air-quality-moderate", locale),
                "severity": "info",
            }
        )

    # Air quality poor — warning
    if weather.air_quality_index > 60:
        tips.append(
            {
                "id": "tip-air-quality-poor",
                "category": "safety",
                "message": get_tip_translation("tip-air-quality-poor", locale),
                "severity": "warning",
            }
        )

    return tips
