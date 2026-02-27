from app.rules.equipment_rules import get_equipment_items
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


def test_long_ride_includes_repair_kit() -> None:
    weather = _make_weather()
    items = get_equipment_items(
        weather, distance_km=40, bike_type="rennrad", locale="en"
    )
    names = [i["name"] for i in items]
    assert any("Repair" in n or "Puncture" in n for n in names)


def test_short_ride_also_includes_repair_kit() -> None:
    """Repair kit is always present regardless of distance."""
    weather = _make_weather()
    items = get_equipment_items(
        weather, distance_km=10, bike_type="rennrad", locale="en"
    )
    ids = [i["id"] for i in items]
    assert "eq-repair-kit" in ids


def test_repair_kit_has_contents() -> None:
    """Repair kit item includes a contents sub-list."""
    weather = _make_weather()
    items = get_equipment_items(
        weather, distance_km=50, bike_type="rennrad", locale="en"
    )
    repair = next(i for i in items if i["id"] == "eq-repair-kit")
    assert "contents" in repair
    assert len(repair["contents"]) > 0
    assert all("name" in c for c in repair["contents"])


def test_high_uv_includes_sunscreen() -> None:
    weather = _make_weather(uv_index=5)
    items = get_equipment_items(
        weather, distance_km=20, bike_type="rennrad", locale="en"
    )
    names = [i["name"] for i in items]
    assert any("Sunscreen" in n for n in names)


def test_evening_ride_includes_lights() -> None:
    weather = _make_weather(sunset="18:30")
    items = get_equipment_items(
        weather,
        distance_km=20,
        ride_start_time="16:00",
        ride_end_time="19:00",
        bike_type="rennrad",
        locale="en",
    )
    names = [i["name"] for i in items]
    assert any("Light" in n for n in names)


def test_rainy_ride_includes_mudguards() -> None:
    weather = _make_weather(precipitation_probability=70)
    items = get_equipment_items(
        weather, distance_km=20, bike_type="rennrad", locale="en"
    )
    names = [i["name"] for i in items]
    assert any("Mudguard" in n for n in names)
    assert any("Dry Bag" in n for n in names)


def test_always_includes_water() -> None:
    weather = _make_weather()
    items = get_equipment_items(
        weather, distance_km=10, bike_type="rennrad", locale="en"
    )
    names = [i["name"] for i in items]
    assert any("Water" in n for n in names)


def test_cold_includes_warm_drink() -> None:
    weather = _make_weather(temp_min=0, temp_feels_like=2)
    items = get_equipment_items(weather, distance_km=20, bike_type="rennrad")
    names = [i["name"] for i in items]
    assert any("Warm" in n for n in names)


def test_very_long_ride_includes_energy() -> None:
    weather = _make_weather()
    items = get_equipment_items(
        weather, distance_km=60, bike_type="rennrad", locale="en"
    )
    names = [i["name"] for i in items]
    assert any("Energy" in n for n in names)


# ── Safety items integrated into equipment ───────────────────────────


def test_equipment_includes_helmet() -> None:
    weather = _make_weather()
    items = get_equipment_items(
        weather, distance_km=20, bike_type="rennrad", locale="en"
    )
    ids = [i["id"] for i in items]
    assert "eq-helmet-rennrad" in ids


def test_equipment_has_categories() -> None:
    weather = _make_weather()
    items = get_equipment_items(weather, distance_km=40, bike_type="mtb", locale="en")
    categories = {i.get("category") for i in items}
    assert "safety" in categories
    assert "hydration" in categories


def test_city_equipment_includes_lock_and_bell() -> None:
    weather = _make_weather()
    items = get_equipment_items(weather, distance_km=10, bike_type="city", locale="en")
    ids = [i["id"] for i in items]
    assert "eq-lock-city" in ids
    assert "eq-bell-city" in ids
