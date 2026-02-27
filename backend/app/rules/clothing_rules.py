"""Rule-based clothing recommendations from weather, bike type, and intensity."""

from app.rules.bike_profiles import (
    BIKE_TYPES_WITH_WARMERS,
    apply_bike_override,
)
from app.rules.translations import (
    get_clothing_translation,
    SHOE_VENTILATION,
    temp_range_str,
)
from app.services.weather import WeatherForecast


def _make_item(
    id: str,
    icon: str,
    locale: str,
    format_vars: dict,
    alternatives: list[dict] | None = None,
    bike_type: str = "",
) -> dict:
    # Build the generic item first
    item: dict = {"id": id, "icon": icon}

    # Apply bike-type override (may change id and icon)
    if bike_type:
        item = apply_bike_override(item, bike_type)

    # Look up translation for the (possibly overridden) id, fallback to generic
    trans = get_clothing_translation(item["id"], locale)
    if not trans:
        trans = get_clothing_translation(id, locale)
    name = trans["name"] if trans else id
    reason_template = trans["reason"] if trans else ""
    reason = reason_template.format(**format_vars) if reason_template else ""

    item["name"] = name
    item["reason"] = reason

    if alternatives:
        translated_alts = []
        for a in alternatives:
            alt_trans = get_clothing_translation(a["id"], locale)
            translated_alts.append(
                {
                    "id": a["id"],
                    "name": alt_trans["name"] if alt_trans else a["id"],
                    "icon": a["icon"],
                }
            )
        item["alternatives"] = translated_alts
    return item


def get_clothing_items(
    weather: WeatherForecast, bike_type: str, intensity: str, locale: str = "de"
) -> list[dict]:
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
        "temp_range": temp_range_str(temp_min, temp_max),
        "feels": feels,
        "precip": precip,
        "wind": wind,
        "uv_index": weather.uv_index,
    }

    has_warmers = bike_type in BIKE_TYPES_WITH_WARMERS

    # --- HEAD ---
    if effective_feels >= 30:
        items.append(
            _make_item("cl-cycling-cap", "headband", locale, fvars, bike_type=bike_type)
        )
    elif effective_feels < 5:
        items.append(
            _make_item(
                "cl-helmet-cover", "helmet-cover", locale, fvars, bike_type=bike_type
            )
        )
    elif effective_feels < 15:
        items.append(
            _make_item("cl-headband", "headband", locale, fvars, bike_type=bike_type)
        )

    # Helmet rain cover — broader: rain even at warmer temps (5-20°C)
    if precip > 30 and 5 <= effective_feels < 20:
        items.append(
            _make_item(
                "cl-helmet-cover", "helmet-cover", locale, fvars, bike_type=bike_type
            )
        )

    # --- EYES ---
    if weather.uv_index >= 3:
        items.append(
            _make_item(
                "cl-sunglasses", "sunglasses", locale, fvars, bike_type=bike_type
            )
        )
    elif precip > 30:
        items.append(
            _make_item("cl-glasses", "glasses", locale, fvars, bike_type=bike_type)
        )
    elif effective_feels < 5:
        items.append(
            _make_item("cl-glasses-wind", "glasses", locale, fvars, bike_type=bike_type)
        )

    # --- NECK / FACE ---
    if effective_feels < 5:
        items.append(
            _make_item(
                "cl-neck-gaiter", "neck-gaiter", locale, fvars, bike_type=bike_type
            )
        )
    if effective_feels < 0:
        items.append(
            _make_item("cl-face-mask", "face-mask", locale, fvars, bike_type=bike_type)
        )

    # --- BASE LAYER ---
    if effective_feels < 10:
        items.append(
            _make_item(
                "cl-base-merino", "base-layer", locale, fvars, bike_type=bike_type
            )
        )
    else:
        items.append(
            _make_item(
                "cl-base-wicking", "base-layer", locale, fvars, bike_type=bike_type
            )
        )

    # --- MID / JERSEY ---
    if effective_feels < 0:
        items.append(
            _make_item(
                "cl-thermal-jersey", "jersey-long", locale, fvars, bike_type=bike_type
            )
        )
    elif effective_feels < 10:
        alts = [{"id": "cl-jersey-arm", "icon": "arm-warmers"}] if has_warmers else None
        items.append(
            _make_item(
                "cl-jersey-long",
                "jersey-long",
                locale,
                fvars,
                alternatives=alts,
                bike_type=bike_type,
            )
        )
    elif effective_feels < 20:
        alts = (
            [{"id": "cl-jersey-short-alt", "icon": "arm-warmers"}]
            if has_warmers
            else None
        )
        items.append(
            _make_item(
                "cl-jersey-long-light",
                "jersey-long",
                locale,
                fvars,
                alternatives=alts,
                bike_type=bike_type,
            )
        )
    else:
        items.append(
            _make_item(
                "cl-jersey-short",
                "jersey",
                locale,
                fvars,
                alternatives=(
                    [{"id": "cl-jersey-sleeveless", "icon": "jersey"}]
                    if effective_feels >= 30
                    else None
                ),
                bike_type=bike_type,
            )
        )

    # --- OUTER LAYER ---
    if precip > 50:
        items.append(
            _make_item(
                "cl-rain-jacket", "rain-jacket", locale, fvars, bike_type=bike_type
            )
        )
    elif precip > 20:
        items.append(
            _make_item(
                "cl-packable-rain",
                "jacket",
                locale,
                fvars,
                alternatives=[{"id": "cl-vest-alt", "icon": "vest"}],
                bike_type=bike_type,
            )
        )
    elif wind > 30:
        items.append(
            _make_item("cl-wind-jacket", "jacket", locale, fvars, bike_type=bike_type)
        )
    elif wind > 15:
        items.append(
            _make_item(
                "cl-wind-vest",
                "vest",
                locale,
                fvars,
                alternatives=[{"id": "cl-jacket-alt", "icon": "jacket"}],
                bike_type=bike_type,
            )
        )
    elif effective_feels < 5:
        items.append(
            _make_item(
                "cl-insulated-jacket", "jacket", locale, fvars, bike_type=bike_type
            )
        )
    elif effective_feels < 10:
        # Windstopper standard below 10°C per Pedalieri guide
        items.append(
            _make_item(
                "cl-windstopper-jacket",
                "jacket",
                locale,
                fvars,
                alternatives=[{"id": "cl-wind-vest", "icon": "vest"}],
                bike_type=bike_type,
            )
        )

    # --- LEGS ---
    if effective_feels < 5:
        alts = (
            [{"id": "cl-tights-warmers", "icon": "leg-warmers"}]
            if has_warmers
            else None
        )
        items.append(
            _make_item(
                "cl-thermal-tights",
                "pants-long",
                locale,
                fvars,
                alternatives=alts,
                bike_type=bike_type,
            )
        )
        # Thermal undershorts for extreme cold
        if effective_feels < 0:
            items.append(
                _make_item(
                    "cl-thermal-undershorts",
                    "pants-short",
                    locale,
                    fvars,
                    bike_type=bike_type,
                )
            )
    elif effective_feels < 15:
        alts = (
            [{"id": "cl-shorts-warmers", "icon": "leg-warmers"}]
            if has_warmers
            else None
        )
        items.append(
            _make_item(
                "cl-padded-tights",
                "pants-long",
                locale,
                fvars,
                alternatives=alts,
                bike_type=bike_type,
            )
        )
    else:
        items.append(
            _make_item("cl-shorts", "pants-short", locale, fvars, bike_type=bike_type)
        )

    # Rain overpants — broadened: up to 25°C per Pedalieri guide
    if precip > 50 and effective_feels < 25:
        items.append(
            _make_item("cl-overpants", "overpants", locale, fvars, bike_type=bike_type)
        )

    # --- HANDS ---
    if effective_feels < 0:
        items.append(
            _make_item(
                "cl-gloves-waterproof",
                "gloves-waterproof",
                locale,
                fvars,
                bike_type=bike_type,
            )
        )
    elif effective_feels < 10:
        if precip > 40:
            items.append(
                _make_item(
                    "cl-gloves-wp",
                    "gloves-waterproof",
                    locale,
                    fvars,
                    bike_type=bike_type,
                )
            )
        else:
            items.append(
                _make_item(
                    "cl-gloves-warm", "gloves-warm", locale, fvars, bike_type=bike_type
                )
            )
    else:
        items.append(
            _make_item(
                "cl-gloves-light", "gloves-light", locale, fvars, bike_type=bike_type
            )
        )

    # --- FEET ---
    # Shoe covers — broadened: any rain > 30% (per Pedalieri guide)
    if precip > 30:
        items.append(
            _make_item(
                "cl-shoe-covers", "shoe-covers", locale, fvars, bike_type=bike_type
            )
        )

    # Shoes — dynamic ventilation text
    if effective_feels > 15:
        ventilation = SHOE_VENTILATION.get(f"{locale}_good", "Good ventilation")
    else:
        ventilation = SHOE_VENTILATION.get(
            f"{locale}_stiff", "Stiff sole for efficient power transfer"
        )
    shoe_fvars = {**fvars, "ventilation": ventilation}
    items.append(
        _make_item("cl-shoes", "shoes", locale, shoe_fvars, bike_type=bike_type)
    )

    # --- SOCKS ---
    if effective_feels < 5:
        items.append(
            _make_item("cl-socks-warm", "socks", locale, fvars, bike_type=bike_type)
        )
    elif effective_feels < 15:
        items.append(
            _make_item("cl-socks-mid", "socks", locale, fvars, bike_type=bike_type)
        )
    else:
        items.append(
            _make_item("cl-socks-thin", "socks", locale, fvars, bike_type=bike_type)
        )

    return items
