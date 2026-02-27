from app.rules.clothing_rules import get_clothing_items
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


def test_freezing_weather_includes_thermal_layers() -> None:
    weather = _make_weather(temp_min=-5, temp_max=0, temp_feels_like=-3)
    items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    names = [i["name"] for i in items]
    assert any("Thermal" in n or "Merino" in n for n in names)
    assert any("Insulated" in n or "Thermal" in n or "Waterproof" in n for n in names)


def test_warm_weather_minimal_clothing() -> None:
    weather = _make_weather(temp_min=22, temp_max=30, temp_feels_like=26)
    items = get_clothing_items(weather, "rennrad", "moderat")
    icons = [i["icon"] for i in items]
    assert "jersey" in icons
    assert "pants-short" in icons


def test_rain_adds_rain_gear() -> None:
    weather = _make_weather(precipitation_probability=70)
    items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    names = [i["name"] for i in items]
    assert any("Waterproof" in n and "Jacket" in n for n in names)


def test_light_rain_adds_packable_jacket() -> None:
    weather = _make_weather(precipitation_probability=35)
    items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    names = [i["name"] for i in items]
    assert any("Packable" in n or "Rain" in n for n in names)


def test_wind_adds_wind_protection() -> None:
    weather = _make_weather(wind_speed=35, precipitation_probability=5)
    items = get_clothing_items(weather, "rennrad", "moderat")
    names = [i["name"] for i in items]
    assert any("Wind" in n for n in names)


def test_each_item_has_reason_with_values() -> None:
    weather = _make_weather(temp_min=5, temp_max=12, temp_feels_like=8)
    items = get_clothing_items(weather, "rennrad", "moderat")
    for item in items:
        assert item["reason"], f"Item {item['name']} has empty reason"
        assert len(item["reason"]) > 10, f"Item {item['name']} reason too short"
        # Reason should contain actual numeric values
        assert any(c.isdigit() for c in item["reason"]), (
            f"Item {item['name']} reason lacks numeric values: {item['reason']}"
        )


def test_temperature_bands_are_complete() -> None:
    """Test each temperature band produces different clothing sets."""
    bands = [
        (-10, -5, -8),  # < 0°C
        (0, 4, 2),  # 0-5°C
        (5, 9, 7),  # 5-10°C
        (10, 14, 12),  # 10-15°C
        (15, 19, 17),  # 15-20°C
        (22, 30, 26),  # > 20°C
    ]
    results = []
    for tmin, tmax, feels in bands:
        weather = _make_weather(temp_min=tmin, temp_max=tmax, temp_feels_like=feels)
        items = get_clothing_items(weather, "rennrad", "moderat")
        assert len(items) >= 4, f"Too few items for band {tmin}-{tmax}"
        results.append(set(i["id"] for i in items))

    # Each band should differ from adjacent bands
    for i in range(len(results) - 1):
        assert results[i] != results[i + 1], (
            f"Bands {bands[i]} and {bands[i + 1]} produced identical items"
        )


def test_neck_gaiter_below_5c() -> None:
    weather = _make_weather(temp_min=-2, temp_max=3, temp_feels_like=0)
    items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    icons = [i["icon"] for i in items]
    assert "neck-gaiter" in icons


def test_no_neck_gaiter_warm() -> None:
    weather = _make_weather(temp_min=10, temp_max=18, temp_feels_like=14)
    items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    icons = [i["icon"] for i in items]
    assert "neck-gaiter" not in icons


def test_face_mask_below_0c() -> None:
    weather = _make_weather(temp_min=-5, temp_max=0, temp_feels_like=-3)
    items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    icons = [i["icon"] for i in items]
    assert "face-mask" in icons


def test_no_face_mask_above_0c() -> None:
    weather = _make_weather(temp_min=2, temp_max=8, temp_feels_like=4)
    items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    icons = [i["icon"] for i in items]
    assert "face-mask" not in icons


def test_cycling_cap_hot_weather() -> None:
    weather = _make_weather(temp_min=28, temp_max=35, temp_feels_like=32)
    items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    ids = [i["id"] for i in items]
    assert "cl-cycling-cap" in ids


def test_broadened_shoe_covers_rain() -> None:
    """Shoe covers should trigger at precip > 30% regardless of temp."""
    weather = _make_weather(
        temp_min=15, temp_max=22, temp_feels_like=18, precipitation_probability=40
    )
    items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    icons = [i["icon"] for i in items]
    assert "shoe-covers" in icons


def test_thermal_undershorts_below_0c() -> None:
    weather = _make_weather(temp_min=-5, temp_max=0, temp_feels_like=-3)
    items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    ids = [i["id"] for i in items]
    assert "cl-thermal-undershorts" in ids


# ── Bike-type differentiation tests ─────────────────────────────────────


def test_rennrad_gets_bib_shorts() -> None:
    weather = _make_weather(temp_min=22, temp_max=30, temp_feels_like=26)
    items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    ids = [i["id"] for i in items]
    assert "cl-shorts-rennrad" in ids


def test_city_gets_casual_shorts() -> None:
    weather = _make_weather(temp_min=22, temp_max=30, temp_feels_like=26)
    items = get_clothing_items(weather, "city", "moderat", locale="en")
    ids = [i["id"] for i in items]
    assert "cl-shorts-city" in ids
    names = [i["name"] for i in items]
    assert any("Casual" in n for n in names)


def test_mtb_gets_baggy_shorts() -> None:
    weather = _make_weather(temp_min=22, temp_max=30, temp_feels_like=26)
    items = get_clothing_items(weather, "mtb", "moderat", locale="en")
    ids = [i["id"] for i in items]
    assert "cl-shorts-mtb" in ids


def test_different_bike_types_different_jerseys() -> None:
    weather = _make_weather(temp_min=22, temp_max=30, temp_feels_like=26)
    rennrad_items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    city_items = get_clothing_items(weather, "city", "moderat", locale="en")
    rr_jersey = next(i for i in rennrad_items if "jersey" in i["id"])
    city_jersey = next(i for i in city_items if "jersey" in i["id"])
    assert rr_jersey["id"] != city_jersey["id"]
    assert rr_jersey["name"] != city_jersey["name"]


def test_rennrad_gets_clip_shoes() -> None:
    weather = _make_weather(temp_min=22, temp_max=30, temp_feels_like=26)
    items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    ids = [i["id"] for i in items]
    assert "cl-shoes-rennrad" in ids


def test_city_gets_everyday_shoes() -> None:
    weather = _make_weather(temp_min=22, temp_max=30, temp_feels_like=26)
    items = get_clothing_items(weather, "city", "moderat", locale="en")
    ids = [i["id"] for i in items]
    assert "cl-shoes-city" in ids


def test_mtb_no_arm_warmers_alternative() -> None:
    """MTB should not offer arm warmers as alternative (gets full-length instead)."""
    weather = _make_weather(temp_min=5, temp_max=12, temp_feels_like=8)
    items = get_clothing_items(weather, "mtb", "moderat", locale="en")
    jersey = next(i for i in items if "jersey" in i["id"])
    alts = jersey.get("alternatives")
    assert alts is None or not any("arm" in a["id"] for a in alts)


def test_rennrad_has_arm_warmers_alternative() -> None:
    """Rennrad should offer arm warmers as alternative for jerseys."""
    weather = _make_weather(temp_min=5, temp_max=12, temp_feels_like=8)
    items = get_clothing_items(weather, "rennrad", "moderat", locale="en")
    jersey = next(i for i in items if "jersey" in i["id"])
    alts = jersey.get("alternatives", [])
    assert any("arm" in a["id"] for a in alts)


def test_city_no_leg_warmers_alternative() -> None:
    """City should not offer leg warmers as alternative (gets full-length instead)."""
    weather = _make_weather(temp_min=5, temp_max=12, temp_feels_like=8)
    items = get_clothing_items(weather, "city", "moderat", locale="en")
    tights = next(i for i in items if "tights" in i["id"] or "padded" in i["id"])
    alts = tights.get("alternatives")
    assert alts is None or not any("leg" in a["id"] for a in alts)
