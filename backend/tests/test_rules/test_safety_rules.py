"""Tests for safety_rules.py — safety equipment recommendations."""

from app.rules.safety_rules import get_safety_items
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


def test_helmet_always_included() -> None:
    for bt in ["rennrad", "gravel", "mtb", "city"]:
        weather = _make_weather()
        items = get_safety_items(weather, bike_type=bt, locale="en")
        ids = [i["id"] for i in items]
        assert f"eq-helmet-{bt}" in ids


def test_helmet_is_bike_specific() -> None:
    weather = _make_weather()
    rennrad_items = get_safety_items(weather, bike_type="rennrad", locale="en")
    mtb_items = get_safety_items(weather, bike_type="mtb", locale="en")
    rr_helmet = next(i for i in rennrad_items if "helmet" in i["id"])
    mtb_helmet = next(i for i in mtb_items if "helmet" in i["id"])
    assert rr_helmet["id"] != mtb_helmet["id"]


def test_reflective_vest_at_night() -> None:
    weather = _make_weather(sunset="18:30")
    items = get_safety_items(
        weather,
        bike_type="rennrad",
        ride_start_time="17:00",
        ride_end_time="19:30",
        locale="en",
    )
    ids = [i["id"] for i in items]
    assert "eq-reflective-vest" in ids


def test_no_reflective_vest_daytime() -> None:
    weather = _make_weather(sunrise="06:30", sunset="18:30")
    items = get_safety_items(
        weather,
        bike_type="rennrad",
        ride_start_time="09:00",
        ride_end_time="12:00",
        locale="en",
    )
    ids = [i["id"] for i in items]
    assert "eq-reflective-vest" not in ids


def test_reflective_vest_heavy_rain() -> None:
    weather = _make_weather(precipitation_probability=60)
    items = get_safety_items(
        weather,
        bike_type="rennrad",
        ride_start_time="10:00",
        ride_end_time="12:00",
        locale="en",
    )
    ids = [i["id"] for i in items]
    assert "eq-reflective-vest" in ids


def test_mtb_always_gets_protectors() -> None:
    weather = _make_weather()
    items = get_safety_items(weather, bike_type="mtb", locale="en")
    ids = [i["id"] for i in items]
    assert "eq-protectors-mtb" in ids


def test_gravel_gets_optional_protectors() -> None:
    weather = _make_weather()
    items = get_safety_items(weather, bike_type="gravel", locale="en")
    ids = [i["id"] for i in items]
    assert "eq-protectors-gravel" in ids


def test_rennrad_no_protectors() -> None:
    weather = _make_weather()
    items = get_safety_items(weather, bike_type="rennrad", locale="en")
    ids = [i["id"] for i in items]
    assert not any("protectors" in i for i in ids)


def test_city_no_protectors() -> None:
    weather = _make_weather()
    items = get_safety_items(weather, bike_type="city", locale="en")
    ids = [i["id"] for i in items]
    assert not any("protectors" in i for i in ids)


def test_first_aid_long_ride() -> None:
    weather = _make_weather()
    items = get_safety_items(weather, bike_type="rennrad", distance_km=25, locale="en")
    ids = [i["id"] for i in items]
    assert "eq-first-aid" in ids


def test_first_aid_mtb_short_ride() -> None:
    weather = _make_weather()
    items = get_safety_items(weather, bike_type="mtb", distance_km=5, locale="en")
    ids = [i["id"] for i in items]
    assert "eq-first-aid" in ids


def test_no_first_aid_short_road_ride() -> None:
    weather = _make_weather()
    items = get_safety_items(weather, bike_type="rennrad", distance_km=10, locale="en")
    ids = [i["id"] for i in items]
    assert "eq-first-aid" not in ids


def test_city_always_gets_lock() -> None:
    weather = _make_weather()
    items = get_safety_items(weather, bike_type="city", distance_km=5, locale="en")
    ids = [i["id"] for i in items]
    assert "eq-lock-city" in ids


def test_rennrad_lock_only_long_rides() -> None:
    weather = _make_weather()
    short = get_safety_items(weather, bike_type="rennrad", distance_km=30, locale="en")
    long = get_safety_items(weather, bike_type="rennrad", distance_km=60, locale="en")
    assert "eq-lock" not in [i["id"] for i in short]
    assert "eq-lock" in [i["id"] for i in long]


def test_city_always_gets_bell() -> None:
    weather = _make_weather()
    items = get_safety_items(weather, bike_type="city", locale="en")
    ids = [i["id"] for i in items]
    assert "eq-bell-city" in ids


def test_gravel_gets_bell() -> None:
    weather = _make_weather()
    items = get_safety_items(weather, bike_type="gravel", locale="en")
    ids = [i["id"] for i in items]
    assert "eq-bell-gravel" in ids


def test_rennrad_no_bell() -> None:
    weather = _make_weather()
    items = get_safety_items(weather, bike_type="rennrad", locale="en")
    ids = [i["id"] for i in items]
    assert not any("bell" in i for i in ids)


def test_all_items_have_safety_category() -> None:
    weather = _make_weather()
    items = get_safety_items(weather, bike_type="mtb", distance_km=30, locale="en")
    for item in items:
        assert item["category"] == "safety"
