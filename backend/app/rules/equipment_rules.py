"""Rule-based equipment recommendations from weather, distance, and time."""

from app.rules.repair_kit_rules import get_repair_kit_contents
from app.rules.safety_rules import get_safety_items
from app.rules.translations import get_equipment_translation, temp_range_str
from app.services.weather import WeatherForecast


def _make_eq_item(
    item_id: str, locale: str, format_vars: dict, category: str = "gear"
) -> dict:
    trans = get_equipment_translation(item_id, locale)
    name = trans["name"] if trans else item_id
    reason_template = trans["reason"] if trans else ""
    reason = reason_template.format(**format_vars) if reason_template else ""
    return {"id": item_id, "name": name, "reason": reason, "category": category}


def get_equipment_items(
    weather: WeatherForecast,
    distance_km: float | None,
    ride_start_time: str | None = None,
    ride_end_time: str | None = None,
    bike_type: str = "rennrad",
    intensity: str = "moderat",
    locale: str = "de",
    gravel_style: str | None = None,
) -> list[dict]:
    """Return a list of equipment item dicts."""
    items: list[dict] = []
    dist = distance_km or 0
    precip = weather.precipitation_probability
    temp = weather.temp_feels_like

    dist_suffix = (
        f" over {dist:.0f} km"
        if dist > 0 and locale == "en"
        else (f" über {dist:.0f} km" if dist > 0 else "")
    )

    fvars = {
        "temp_min": weather.temp_min,
        "temp_max": weather.temp_max,
        "temp_range": temp_range_str(weather.temp_min, weather.temp_max),
        "precip": precip,
        "uv_index": weather.uv_index,
        "sunrise": weather.sunrise,
        "sunset": weather.sunset,
        "ride_start": ride_start_time or "",
        "ride_end": ride_end_time or "",
        "dist": dist,
        "dist_suffix": dist_suffix,
    }

    # ── SAFETY ITEMS (helmet, vest, protectors, lock, bell, first aid) ──
    safety_items = get_safety_items(
        weather,
        bike_type=bike_type,
        distance_km=distance_km,
        ride_start_time=ride_start_time,
        ride_end_time=ride_end_time,
        locale=locale,
        gravel_style=gravel_style,
    )
    items.extend(safety_items)

    # ── HYDRATION ────────────────────────────────────────────────────
    if temp < 5:
        items.append(
            _make_eq_item("eq-warm-drink", locale, fvars, category="hydration")
        )
    items.append(_make_eq_item("eq-water", locale, fvars, category="hydration"))

    # UV protection
    if weather.uv_index >= 3:
        items.append(_make_eq_item("eq-sunscreen", locale, fvars, category="gear"))

    # Lights: if ride falls outside daylight hours
    if ride_start_time and weather.sunrise and weather.sunset:
        before_sunrise = ride_start_time < weather.sunrise
        after_sunset = (ride_end_time or ride_start_time) >= weather.sunset
        if before_sunrise and after_sunset:
            items.append(
                _make_eq_item("eq-lights-both", locale, fvars, category="safety")
            )
        elif before_sunrise:
            items.append(
                _make_eq_item(
                    "eq-lights-before-sunrise", locale, fvars, category="safety"
                )
            )
        elif after_sunset:
            items.append(
                _make_eq_item(
                    "eq-lights-after-sunset", locale, fvars, category="safety"
                )
            )

    # Rain gear
    if precip > 50:
        items.append(_make_eq_item("eq-mudguards", locale, fvars, category="gear"))
        items.append(_make_eq_item("eq-dry-bag", locale, fvars, category="gear"))

    # Repair kit — always included, contents scale with distance/bike/intensity
    repair_contents = get_repair_kit_contents(
        dist, bike_type, intensity, locale, gravel_style=gravel_style
    )
    repair_item = _make_eq_item("eq-repair-kit", locale, fvars, category="tools")
    repair_item["contents"] = repair_contents
    items.append(repair_item)

    if dist > 50:
        items.append(_make_eq_item("eq-energy", locale, fvars, category="nutrition"))

    return items
