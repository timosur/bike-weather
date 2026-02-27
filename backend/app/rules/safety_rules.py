"""Rule-based safety equipment recommendations based on bike type, weather, and ride context."""

from app.rules.translations import get_equipment_translation, temp_range_str
from app.services.weather import WeatherForecast


def _make_safety_item(item_id: str, locale: str, format_vars: dict) -> dict:
    trans = get_equipment_translation(item_id, locale)
    name = trans["name"] if trans else item_id
    reason_template = trans["reason"] if trans else ""
    reason = reason_template.format(**format_vars) if reason_template else ""
    return {"id": item_id, "name": name, "reason": reason, "category": "safety"}


def get_safety_items(
    weather: WeatherForecast,
    bike_type: str,
    distance_km: float | None = None,
    ride_start_time: str | None = None,
    ride_end_time: str | None = None,
    locale: str = "de",
) -> list[dict]:
    """Return safety equipment items adjusted for bike type and conditions."""
    items: list[dict] = []
    dist = distance_km or 0
    precip = weather.precipitation_probability

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
    }

    # ── HELMET (always, bike-type-specific) ──────────────────────────
    helmet_key = f"eq-helmet-{bike_type}"
    items.append(_make_safety_item(helmet_key, locale, fvars))

    # ── REFLECTIVE VEST ──────────────────────────────────────────────
    # At dusk/dawn/night or poor visibility (heavy rain)
    needs_visibility = False
    if ride_start_time and weather.sunrise and weather.sunset:
        before_sunrise = ride_start_time < weather.sunrise
        after_sunset = (ride_end_time or ride_start_time) >= weather.sunset
        if before_sunrise or after_sunset:
            needs_visibility = True
    if precip > 50:
        needs_visibility = True
    if needs_visibility:
        items.append(_make_safety_item("eq-reflective-vest", locale, fvars))

    # ── PROTECTORS (knee/elbow) — MTB always, Gravel optional ───────
    if bike_type == "mtb":
        items.append(_make_safety_item("eq-protectors-mtb", locale, fvars))
    elif bike_type == "gravel":
        items.append(_make_safety_item("eq-protectors-gravel", locale, fvars))

    # ── FIRST AID KIT — long rides, remote rides, MTB ────────────────
    if dist > 20 or bike_type == "mtb":
        items.append(_make_safety_item("eq-first-aid", locale, fvars))

    # ── LOCK — City always, others on longer rides (>50 km) ─────────
    if bike_type == "city":
        items.append(_make_safety_item("eq-lock-city", locale, fvars))
    elif dist > 50:
        items.append(_make_safety_item("eq-lock", locale, fvars))

    # ── BELL — City always (StVZO), Gravel on mixed paths ───────────
    if bike_type == "city":
        items.append(_make_safety_item("eq-bell-city", locale, fvars))
    elif bike_type == "gravel":
        items.append(_make_safety_item("eq-bell-gravel", locale, fvars))

    return items
