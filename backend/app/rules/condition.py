"""Compute overall ride condition rating from weather data."""

from __future__ import annotations

from app.services.weather import WeatherForecast

# Thunderstorm and snow WMO codes
_THUNDERSTORM_CODES = {95, 96, 99}
_SNOW_CODES = {71, 73, 75, 77, 85, 86}


class ConditionReason:
    """A single reason contributing to the condition rating."""

    __slots__ = ("code", "emoji", "actual", "threshold", "unit")

    def __init__(
        self,
        code: str,
        emoji: str,
        actual: float | str | None = None,
        threshold: float | str | None = None,
        unit: str = "",
    ) -> None:
        self.code = code
        self.emoji = emoji
        self.actual = actual
        self.threshold = threshold
        self.unit = unit

    def to_dict(self) -> dict:
        return {
            "code": self.code,
            "emoji": self.emoji,
            "actual": self.actual,
            "threshold": self.threshold,
            "unit": self.unit,
        }


def compute_condition(
    weather: WeatherForecast,
) -> tuple[str, list[ConditionReason]]:
    """Return (rating, reasons) where rating is one of:
    'ideal', 'good', 'caution', 'not-recommended'.

    *reasons* is a list of ``ConditionReason`` instances that explain the
    rating — including positive reasons for 'ideal'.
    """
    reasons: list[ConditionReason] = []

    # --- NOT RECOMMENDED checks ---
    if weather.weather_code in _THUNDERSTORM_CODES:
        reasons.append(
            ConditionReason("thunderstorm", "⛈️", weather.weather_code, None, "WMO")
        )
        return "not-recommended", reasons

    if weather.weather_code in _SNOW_CODES:
        reasons.append(ConditionReason("snow", "❄️", weather.weather_code, None, "WMO"))
        return "not-recommended", reasons

    if weather.temp_min < -5:
        reasons.append(
            ConditionReason("extreme_cold", "🥶", weather.temp_min, -5, "°C")
        )
        return "not-recommended", reasons

    if weather.wind_speed > 50:
        reasons.append(
            ConditionReason("extreme_wind", "💨", weather.wind_speed, 50, "km/h")
        )
        return "not-recommended", reasons

    if weather.temp_feels_like > 40:
        reasons.append(
            ConditionReason("extreme_heat", "🔥", weather.temp_feels_like, 40, "°C")
        )
        return "not-recommended", reasons

    # --- CAUTION checks (collect all matching) ---
    caution_reasons: list[ConditionReason] = []

    if weather.temp_feels_like > 35:
        caution_reasons.append(
            ConditionReason("high_heat", "☀️", weather.temp_feels_like, 35, "°C")
        )

    if weather.precipitation_probability > 50:
        caution_reasons.append(
            ConditionReason(
                "high_precip", "🌧️", weather.precipitation_probability, 50, "%"
            )
        )

    if weather.temp_min < 5:
        caution_reasons.append(ConditionReason("cold", "🌡️", weather.temp_min, 5, "°C"))

    if weather.wind_speed > 30:
        caution_reasons.append(
            ConditionReason("high_wind", "💨", weather.wind_speed, 30, "km/h")
        )

    if caution_reasons:
        return "caution", caution_reasons

    # --- IDEAL ---
    if (
        weather.precipitation_probability < 20
        and 12 <= weather.temp_feels_like <= 22
        and weather.wind_speed < 15
    ):
        return "ideal", [
            ConditionReason("pleasant_temp", "😊", weather.temp_feels_like, None, "°C"),
            ConditionReason(
                "low_precip", "☀️", weather.precipitation_probability, 20, "%"
            ),
            ConditionReason("calm_wind", "🍃", weather.wind_speed, 15, "km/h"),
        ]

    # --- GOOD (fallback) ---
    # Provide contextual positive/neutral reasons
    good_reasons: list[ConditionReason] = []
    if weather.temp_feels_like >= 12 and weather.temp_feels_like <= 22:
        good_reasons.append(
            ConditionReason("pleasant_temp", "😊", weather.temp_feels_like, None, "°C")
        )
    if weather.precipitation_probability < 30:
        good_reasons.append(
            ConditionReason(
                "low_precip", "☀️", weather.precipitation_probability, 30, "%"
            )
        )
    if weather.wind_speed < 20:
        good_reasons.append(
            ConditionReason("calm_wind", "🍃", weather.wind_speed, 20, "km/h")
        )
    return "good", good_reasons
