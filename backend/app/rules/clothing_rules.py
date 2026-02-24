"""Rule-based clothing recommendations from weather, bike type, and intensity."""

from app.services.weather import WeatherForecast


def _make_item(
    id: str,
    name: str,
    icon: str,
    reason: str,
    alternatives: list[dict] | None = None,
) -> dict:
    item: dict = {"id": id, "name": name, "icon": icon, "reason": reason}
    if alternatives:
        item["alternatives"] = alternatives
    return item


def get_clothing_items(weather: WeatherForecast, bike_type: str, intensity: str) -> list[dict]:
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

    # --- HEAD ---
    if effective_feels < 5:
        items.append(_make_item(
            "cl-helmet-cover", "Waterproof Helmet Cover", "helmet-cover",
            f"Keeps head warm and dry at {temp_min:.0f}°C."
        ))
    elif effective_feels < 15:
        items.append(_make_item(
            "cl-headband", "Light Headband", "headband",
            f"Protects ears from cool riding wind at {temp_min:.0f}°C."
        ))

    # --- EYES ---
    if weather.uv_index >= 3:
        items.append(_make_item(
            "cl-sunglasses", "Sports Sunglasses", "sunglasses",
            f"UV index {weather.uv_index:.0f} — protects eyes from glare and insects."
        ))
    elif precip > 30:
        items.append(_make_item(
            "cl-glasses", "Clear Cycling Glasses", "glasses",
            f"Protects eyes from spray and rain at {precip:.0f}% precipitation."
        ))

    # --- BASE LAYER ---
    if effective_feels < 10:
        items.append(_make_item(
            "cl-base-merino", "Merino Base Layer", "base-layer",
            f"Insulates and regulates body heat at {feels:.0f}°C feels-like."
        ))
    else:
        items.append(_make_item(
            "cl-base-wicking", "Moisture-wicking Base Layer", "base-layer",
            f"Moves sweat away from skin at {feels:.0f}°C."
        ))

    # --- MID / JERSEY ---
    if effective_feels < 0:
        items.append(_make_item(
            "cl-thermal-jersey", "Thermal Long-sleeve Jersey", "jersey-long",
            f"Heavy insulation for freezing {feels:.0f}°C feels-like temperature.",
        ))
    elif effective_feels < 10:
        items.append(_make_item(
            "cl-jersey-long", "Long-sleeve Cycling Jersey", "jersey-long",
            f"Warmth at {temp_min:.0f}–{temp_max:.0f}°C without overheating.",
            alternatives=[{"id": "cl-jersey-arm", "name": "Short-sleeve Jersey + Arm Warmers", "icon": "arm-warmers"}],
        ))
    elif effective_feels < 20:
        items.append(_make_item(
            "cl-jersey-long-light", "Long-sleeve Cycling Jersey", "jersey-long",
            f"Light coverage at {temp_min:.0f}–{temp_max:.0f}°C, can roll up sleeves.",
            alternatives=[{"id": "cl-jersey-short-alt", "name": "Short-sleeve Jersey + Arm Warmers", "icon": "arm-warmers"}],
        ))
    else:
        items.append(_make_item(
            "cl-jersey-short", "Short-sleeve Cycling Jersey", "jersey",
            f"Breathable at {temp_max:.0f}°C, keeps you cool."
        ))

    # --- OUTER LAYER ---
    if precip > 50:
        items.append(_make_item(
            "cl-rain-jacket", "Waterproof Cycling Jacket", "rain-jacket",
            f"Essential at {precip:.0f}% rain probability — sealed seams keep you dry."
        ))
    elif precip > 20:
        items.append(_make_item(
            "cl-packable-rain", "Packable Rain Jacket", "jacket",
            f"Pack along at {precip:.0f}% rain chance — quick to put on.",
            alternatives=[{"id": "cl-vest-alt", "name": "Light Wind Vest", "icon": "vest"}],
        ))
    elif wind > 30:
        items.append(_make_item(
            "cl-wind-jacket", "Wind Jacket", "jacket",
            f"Full wind protection at {wind:.0f} km/h.",
        ))
    elif wind > 15:
        items.append(_make_item(
            "cl-wind-vest", "Light Wind Vest", "vest",
            f"Keeps wind off your core at {wind:.0f} km/h.",
            alternatives=[{"id": "cl-jacket-alt", "name": "Packable Wind Jacket", "icon": "jacket"}],
        ))
    elif effective_feels < 5:
        items.append(_make_item(
            "cl-insulated-jacket", "Insulated Cycling Jacket", "jacket",
            f"Extra warmth at {feels:.0f}°C feels-like temperature."
        ))

    # --- LEGS ---
    if effective_feels < 5:
        items.append(_make_item(
            "cl-thermal-tights", "Thermal Cycling Tights", "pants-long",
            f"Warm legs at {temp_min:.0f}°C minimum, wind-resistant.",
            alternatives=[{"id": "cl-tights-warmers", "name": "Cycling Tights + Leg Warmers", "icon": "leg-warmers"}],
        ))
    elif effective_feels < 15:
        items.append(_make_item(
            "cl-padded-tights", "Long Padded Cycling Tights", "pants-long",
            f"Padding for comfort, long legs at {temp_min:.0f}–{temp_max:.0f}°C.",
            alternatives=[{"id": "cl-shorts-warmers", "name": "Short Bib Shorts + Leg Warmers", "icon": "leg-warmers"}],
        ))
    else:
        items.append(_make_item(
            "cl-shorts", "Padded Cycling Shorts", "pants-short",
            f"Breathable at {temp_max:.0f}°C with padding for comfort."
        ))

    # Rain overpants
    if precip > 50 and effective_feels < 15:
        items.append(_make_item(
            "cl-overpants", "Waterproof Overpants", "overpants",
            f"Rain protection for legs at {precip:.0f}% precipitation."
        ))

    # --- HANDS ---
    if effective_feels < 0:
        items.append(_make_item(
            "cl-gloves-waterproof", "Waterproof Winter Gloves", "gloves-waterproof",
            f"Waterproof insulation at {feels:.0f}°C and {wind:.0f} km/h wind."
        ))
    elif effective_feels < 10:
        if precip > 40:
            items.append(_make_item(
                "cl-gloves-wp", "Waterproof Winter Gloves", "gloves-waterproof",
                f"Wet hands + {wind:.0f} km/h wind = rapid heat loss. Waterproof is a must."
            ))
        else:
            items.append(_make_item(
                "cl-gloves-warm", "Warm Cycling Gloves", "gloves-warm",
                f"Insulated gloves at {feels:.0f}°C feels-like."
            ))
    else:
        items.append(_make_item(
            "cl-gloves-light", "Light Cycling Gloves", "gloves-light",
            f"Grip and cushioning at {feels:.0f}°C."
        ))

    # --- FEET ---
    if precip > 50 and effective_feels < 10:
        items.append(_make_item(
            "cl-shoe-covers", "Waterproof Overshoes", "shoe-covers",
            f"Keeps feet dry in rain at {precip:.0f}% precipitation."
        ))
    items.append(_make_item(
        "cl-shoes", "Cycling Shoes", "shoes",
        f"{'Good ventilation' if effective_feels > 15 else 'Stiff sole for efficient power transfer'} at {temp_max:.0f}°C."
    ))

    # --- SOCKS ---
    if effective_feels < 5:
        items.append(_make_item(
            "cl-socks-warm", "Warm Merino Socks", "socks",
            f"Stays warm even when damp at {temp_min:.0f}°C."
        ))
    elif effective_feels < 15:
        items.append(_make_item(
            "cl-socks-mid", "Mid-weight Socks", "socks",
            f"Moderate warmth at {temp_min:.0f}°C start temperature."
        ))
    else:
        items.append(_make_item(
            "cl-socks-thin", "Thin Merino Socks", "socks",
            f"Breathable and odour-neutral at {temp_max:.0f}°C."
        ))

    return items
