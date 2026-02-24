"""Rule-based clothing recommendations from weather, bike type, and intensity."""

from app.rules.translations import get_clothing_translation, SHOE_VENTILATION
from app.services.weather import WeatherForecast


def _make_item(
    id: str,
    icon: str,
    locale: str,
    format_vars: dict,
    alternatives: list[dict] | None = None,
) -> dict:
    trans = get_clothing_translation(id, locale)
    name = trans["name"] if trans else id
    reason_template = trans["reason"] if trans else ""
    reason = reason_template.format(**format_vars) if reason_template else ""

    item: dict = {"id": id, "name": name, "icon": icon, "reason": reason}
    if alternatives:
        translated_alts = []
        for a in alternatives:
            alt_trans = get_clothing_translation(a["id"], locale)
            translated_alts.append({
                "id": a["id"],
                "name": alt_trans["name"] if alt_trans else a["id"],
                "icon": a["icon"],
            })
        item["alternatives"] = translated_alts
    return item


def get_clothing_items(weather: WeatherForecast, bike_type: str, intensity: str, locale: str = "de") -> list[dict]:
    """Return a list of clothing item dicts based on weather conditions."""
    items: list[dict] = []
    feels = weather.temp_feels_like
    temp_min = weather.temp_min
    temp_max = weather.temp_max
    precip = weather.precipitation_probability
    wind = weather.wind_speed

    # Intensity modifier: sporty riders run warmer
    temp_offset = 0
    if intensity == "sportlich":
        temp_offset = 2
    elif intensity == "gemuetlich":
        temp_offset = -2
    effective_feels = feels + temp_offset

    # Common format variables available for all templates
    fvars = {
        "temp_min": temp_min,
        "temp_max": temp_max,
        "feels": feels,
        "precip": precip,
        "wind": wind,
        "uv_index": weather.uv_index,
    }

    # --- HEAD ---
    if effective_feels < 5:
        items.append(_make_item("cl-helmet-cover", "helmet-cover", locale, fvars))
    elif effective_feels < 15:
        items.append(_make_item("cl-headband", "headband", locale, fvars))

    # --- EYES ---
    if weather.uv_index >= 3:
        items.append(_make_item("cl-sunglasses", "sunglasses", locale, fvars))
    elif precip > 30:
        items.append(_make_item("cl-glasses", "glasses", locale, fvars))

    # --- BASE LAYER ---
    if effective_feels < 10:
        items.append(_make_item("cl-base-merino", "base-layer", locale, fvars))
    else:
        items.append(_make_item("cl-base-wicking", "base-layer", locale, fvars))

    # --- MID / JERSEY ---
    if effective_feels < 0:
        items.append(_make_item("cl-thermal-jersey", "jersey-long", locale, fvars))
    elif effective_feels < 10:
        items.append(_make_item(
            "cl-jersey-long", "jersey-long", locale, fvars,
            alternatives=[{"id": "cl-jersey-arm", "icon": "arm-warmers"}],
        ))
    elif effective_feels < 20:
        items.append(_make_item(
            "cl-jersey-long-light", "jersey-long", locale, fvars,
            alternatives=[{"id": "cl-jersey-short-alt", "icon": "arm-warmers"}],
        ))
    else:
        items.append(_make_item("cl-jersey-short", "jersey", locale, fvars))

    # --- OUTER LAYER ---
    if precip > 50:
        items.append(_make_item("cl-rain-jacket", "rain-jacket", locale, fvars))
    elif precip > 20:
        items.append(_make_item(
            "cl-packable-rain", "jacket", locale, fvars,
            alternatives=[{"id": "cl-vest-alt", "icon": "vest"}],
        ))
    elif wind > 30:
        items.append(_make_item("cl-wind-jacket", "jacket", locale, fvars))
    elif wind > 15:
        items.append(_make_item(
            "cl-wind-vest", "vest", locale, fvars,
            alternatives=[{"id": "cl-jacket-alt", "icon": "jacket"}],
        ))
    elif effective_feels < 5:
        items.append(_make_item("cl-insulated-jacket", "jacket", locale, fvars))

    # --- LEGS ---
    if effective_feels < 5:
        items.append(_make_item(
            "cl-thermal-tights", "pants-long", locale, fvars,
            alternatives=[{"id": "cl-tights-warmers", "icon": "leg-warmers"}],
        ))
    elif effective_feels < 15:
        items.append(_make_item(
            "cl-padded-tights", "pants-long", locale, fvars,
            alternatives=[{"id": "cl-shorts-warmers", "icon": "leg-warmers"}],
        ))
    else:
        items.append(_make_item("cl-shorts", "pants-short", locale, fvars))

    # Rain overpants
    if precip > 50 and effective_feels < 15:
        items.append(_make_item("cl-overpants", "overpants", locale, fvars))

    # --- HANDS ---
    if effective_feels < 0:
        items.append(_make_item("cl-gloves-waterproof", "gloves-waterproof", locale, fvars))
    elif effective_feels < 10:
        if precip > 40:
            items.append(_make_item("cl-gloves-wp", "gloves-waterproof", locale, fvars))
        else:
            items.append(_make_item("cl-gloves-warm", "gloves-warm", locale, fvars))
    else:
        items.append(_make_item("cl-gloves-light", "gloves-light", locale, fvars))

    # --- FEET ---
    if precip > 50 and effective_feels < 10:
        items.append(_make_item("cl-shoe-covers", "shoe-covers", locale, fvars))

    # Shoes — dynamic ventilation text
    if effective_feels > 15:
        ventilation = SHOE_VENTILATION.get(f"{locale}_good", "Good ventilation")
    else:
        ventilation = SHOE_VENTILATION.get(f"{locale}_stiff", "Stiff sole for efficient power transfer")
    shoe_fvars = {**fvars, "ventilation": ventilation}
    items.append(_make_item("cl-shoes", "shoes", locale, shoe_fvars))

    # --- SOCKS ---
    if effective_feels < 5:
        items.append(_make_item("cl-socks-warm", "socks", locale, fvars))
    elif effective_feels < 15:
        items.append(_make_item("cl-socks-mid", "socks", locale, fvars))
    else:
        items.append(_make_item("cl-socks-thin", "socks", locale, fvars))

    return items

    return items
