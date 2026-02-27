from app.rules.condition import compute_condition, ConditionReason
from app.services.weather import WeatherForecast


def _make_weather(**overrides) -> WeatherForecast:
    defaults = dict(
        temp_min=12, temp_max=20, temp_feels_like=16,
        precipitation_probability=10, wind_speed=10,
        wind_direction="SW", humidity=55, uv_index=3,
        sunrise="06:30", sunset="18:30", weather_code=0,
        icon="sun", description="Clear sky",
    )
    defaults.update(overrides)
    return WeatherForecast(**defaults)


def _rating(weather: WeatherForecast) -> str:
    """Helper: return only the rating string."""
    rating, _ = compute_condition(weather)
    return rating


def _reason_codes(weather: WeatherForecast) -> list[str]:
    """Helper: return the list of reason codes."""
    _, reasons = compute_condition(weather)
    return [r.code for r in reasons]


def test_ideal_conditions() -> None:
    weather = _make_weather(temp_feels_like=16, precipitation_probability=10, wind_speed=10)
    assert _rating(weather) == "ideal"


def test_ideal_returns_positive_reasons() -> None:
    weather = _make_weather(temp_feels_like=16, precipitation_probability=10, wind_speed=10)
    codes = _reason_codes(weather)
    assert "pleasant_temp" in codes
    assert "low_precip" in codes
    assert "calm_wind" in codes


def test_good_conditions() -> None:
    weather = _make_weather(temp_min=8, temp_feels_like=10, precipitation_probability=15, wind_speed=20)
    assert _rating(weather) == "good"


def test_caution_high_precip() -> None:
    weather = _make_weather(precipitation_probability=60)
    assert _rating(weather) == "caution"
    assert "high_precip" in _reason_codes(weather)


def test_caution_cold() -> None:
    weather = _make_weather(temp_min=3)
    assert _rating(weather) == "caution"
    assert "cold" in _reason_codes(weather)


def test_caution_strong_wind() -> None:
    weather = _make_weather(wind_speed=35)
    assert _rating(weather) == "caution"
    assert "high_wind" in _reason_codes(weather)


def test_caution_collects_multiple_reasons() -> None:
    """When multiple caution triggers match, all reasons are collected."""
    weather = _make_weather(temp_min=3, precipitation_probability=60, wind_speed=35)
    assert _rating(weather) == "caution"
    codes = _reason_codes(weather)
    assert "cold" in codes
    assert "high_precip" in codes
    assert "high_wind" in codes


def test_not_recommended_thunderstorm() -> None:
    weather = _make_weather(weather_code=95)
    assert _rating(weather) == "not-recommended"
    assert "thunderstorm" in _reason_codes(weather)


def test_not_recommended_extreme_cold() -> None:
    weather = _make_weather(temp_min=-8)
    assert _rating(weather) == "not-recommended"
    assert "extreme_cold" in _reason_codes(weather)


def test_not_recommended_snow() -> None:
    weather = _make_weather(weather_code=75)
    assert _rating(weather) == "not-recommended"
    assert "snow" in _reason_codes(weather)


def test_not_recommended_extreme_wind() -> None:
    weather = _make_weather(wind_speed=55)
    assert _rating(weather) == "not-recommended"
    assert "extreme_wind" in _reason_codes(weather)


def test_not_recommended_extreme_heat() -> None:
    weather = _make_weather(temp_feels_like=42, temp_min=30, temp_max=42)
    assert _rating(weather) == "not-recommended"
    assert "extreme_heat" in _reason_codes(weather)


def test_caution_high_heat() -> None:
    weather = _make_weather(temp_feels_like=37, temp_min=25, temp_max=37)
    assert _rating(weather) == "caution"
    assert "high_heat" in _reason_codes(weather)


def test_reason_has_actual_and_threshold() -> None:
    weather = _make_weather(wind_speed=35)
    _, reasons = compute_condition(weather)
    wind_reason = next(r for r in reasons if r.code == "high_wind")
    assert wind_reason.actual == 35
    assert wind_reason.threshold == 30
    assert wind_reason.unit == "km/h"
