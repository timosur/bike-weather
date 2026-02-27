from app.rules.tips_rules import get_tips
from app.services.weather import WeatherForecast


def _make_weather(**overrides) -> WeatherForecast:
    defaults = dict(
        temp_min=12,
        temp_max=20,
        temp_feels_like=16,
        precipitation_probability=10,
        wind_speed=10,
        wind_direction="SW",
        humidity=55,
        uv_index=3,
        sunrise="06:30",
        sunset="18:30",
        weather_code=0,
        icon="sun",
        description="Clear sky",
    )
    defaults.update(overrides)
    return WeatherForecast(**defaults)


def _tip_ids(weather: WeatherForecast, locale: str = "en") -> list[str]:
    return [t["id"] for t in get_tips(weather, locale)]


def test_no_tips_for_mild_weather() -> None:
    weather = _make_weather()
    tips = get_tips(weather, "en")
    # Should get layering tip since 10 <= 16 <= 20
    ids = [t["id"] for t in tips]
    assert "tip-extreme-heat" not in ids
    assert "tip-ice" not in ids


def test_extreme_heat_tip() -> None:
    weather = _make_weather(temp_feels_like=37, temp_min=28, temp_max=38)
    ids = _tip_ids(weather)
    assert "tip-extreme-heat" in ids
    assert "tip-heat" in ids  # Also triggers general heat


def test_general_heat_tip() -> None:
    weather = _make_weather(temp_feels_like=32, temp_min=25, temp_max=33)
    ids = _tip_ids(weather)
    assert "tip-heat" in ids
    assert "tip-extreme-heat" not in ids


def test_ice_tip() -> None:
    weather = _make_weather(temp_min=1, temp_max=8, temp_feels_like=4)
    ids = _tip_ids(weather)
    assert "tip-ice" in ids


def test_visibility_tip() -> None:
    weather = _make_weather(precipitation_probability=50)
    ids = _tip_ids(weather)
    assert "tip-visibility" in ids


def test_layering_tip() -> None:
    weather = _make_weather(temp_feels_like=15)
    ids = _tip_ids(weather)
    assert "tip-layering" in ids


def test_no_layering_tip_when_hot() -> None:
    weather = _make_weather(temp_feels_like=25)
    ids = _tip_ids(weather)
    assert "tip-layering" not in ids


def test_hypothermia_tip_cold_and_wet() -> None:
    weather = _make_weather(temp_feels_like=5, temp_min=3, precipitation_probability=50)
    ids = _tip_ids(weather)
    assert "tip-hypothermia" in ids


def test_no_hypothermia_tip_cold_but_dry() -> None:
    weather = _make_weather(temp_feels_like=5, temp_min=3, precipitation_probability=10)
    ids = _tip_ids(weather)
    assert "tip-hypothermia" not in ids


def test_tip_has_required_fields() -> None:
    weather = _make_weather(temp_feels_like=37, temp_min=28, temp_max=38)
    tips = get_tips(weather, "en")
    for tip in tips:
        assert "id" in tip
        assert "category" in tip
        assert "message" in tip
        assert "severity" in tip
        assert isinstance(tip["message"], str)
        assert len(tip["message"]) > 0


def test_tips_are_translated() -> None:
    weather = _make_weather(temp_min=1, temp_max=8, temp_feels_like=4)
    tips_en = get_tips(weather, "en")
    tips_de = get_tips(weather, "de")
    # Same number of tips, different messages
    assert len(tips_en) == len(tips_de)
    for en, de in zip(tips_en, tips_de):
        assert en["id"] == de["id"]
        assert en["message"] != de["message"]
