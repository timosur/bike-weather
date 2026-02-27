"""Rule-based safety and comfort tips from weather conditions."""

from app.rules.translations import get_tip_translation
from app.services.weather import WeatherForecast


def get_tips(weather: WeatherForecast, locale: str = "de") -> list[dict]:
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

    return tips
