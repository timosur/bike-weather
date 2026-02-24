"""Rule-based equipment recommendations from weather, distance, and time."""

from app.rules.translations import get_equipment_translation
from app.services.weather import WeatherForecast


def _make_eq_item(item_id: str, locale: str, format_vars: dict) -> dict:
    trans = get_equipment_translation(item_id, locale)
    name = trans["name"] if trans else item_id
    reason_template = trans["reason"] if trans else ""
    reason = reason_template.format(**format_vars) if reason_template else ""
    return {"id": item_id, "name": name, "reason": reason}


def get_equipment_items(
    weather: WeatherForecast,
    distance_km: float | None,
    ride_start_time: str | None = None,
    locale: str = "de",
) -> list[dict]:
    """Return a list of equipment item dicts."""
    items: list[dict] = []
    dist = distance_km or 0
    precip = weather.precipitation_probability
    temp = weather.temp_feels_like

    dist_suffix = f" over {dist:.0f} km" if dist > 0 and locale == "en" else (f" über {dist:.0f} km" if dist > 0 else "")

    fvars = {
        "temp_min": weather.temp_min,
        "temp_max": weather.temp_max,
        "precip": precip,
        "uv_index": weather.uv_index,
        "sunset": weather.sunset,
        "dist": dist,
        "dist_suffix": dist_suffix,
    }

    # Always: water
    if temp < 5:
        items.append(_make_eq_item("eq-warm-drink", locale, fvars))
    items.append(_make_eq_item("eq-water", locale, fvars))

    # UV protection
    if weather.uv_index >= 3:
        items.append(_make_eq_item("eq-sunscreen", locale, fvars))

    # Lights: if ride could extend near sunset
    if ride_start_time and weather.sunset:
        items.append(_make_eq_item("eq-lights", locale, fvars))

    # Rain gear
    if precip > 50:
        items.append(_make_eq_item("eq-mudguards", locale, fvars))
        items.append(_make_eq_item("eq-dry-bag", locale, fvars))

    # Long rides
    if dist > 30:
        items.append(_make_eq_item("eq-repair-kit", locale, fvars))
    if dist > 50:
        items.append(_make_eq_item("eq-energy", locale, fvars))

    return items
