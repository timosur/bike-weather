"""Rule-based repair kit contents depending on distance, bike type, and intensity."""

from app.rules.translations import get_repair_kit_translation

# ── ITEM POOLS ──────────────────────────────────────────────────────────
# Each item is an ID that maps to a translation entry in translations.py.
# Items are grouped into tiers: minimal, standard, extended.

# Universal items (apply to all bike types unless overridden)
_MINIMAL_ITEMS = [
    "rk-spare-tube",
    "rk-tire-levers",
    "rk-mini-pump",
    "rk-multi-tool",
]

_STANDARD_EXTRAS = [
    "rk-patch-kit",
    "rk-quick-link",
    "rk-zip-ties",
    "rk-tire-boot",
]

_EXTENDED_EXTRAS = [
    "rk-spare-tube-2",
    "rk-chain-tool",
    "rk-spoke-wrench",
    "rk-electrical-tape",
]

# Bike-type-specific additions at standard+ tier
_BIKE_TYPE_EXTRAS: dict[str, list[str]] = {
    "rennrad": ["rk-co2-cartridge"],
    "gravel": ["rk-tubeless-plugs", "rk-tire-boot-gravel"],
    "mtb": ["rk-tubeless-plugs", "rk-disc-brake-pad", "rk-chain-lube"],
    "city": [],
}

# Bike-type additions already at minimal tier
_BIKE_TYPE_MINIMAL_EXTRAS: dict[str, list[str]] = {
    "rennrad": ["rk-co2-cartridge"],
    "gravel": ["rk-tubeless-plugs"],
    "mtb": ["rk-tubeless-plugs"],
    "city": [],
}


def _distance_tier(distance_km: float, intensity: str) -> str:
    """Determine the repair kit tier based on distance and intensity.

    sportlich bumps up one tier (higher stress on components).
    """
    effective = distance_km
    if intensity == "sportlich":
        effective += 30

    if effective < 30:
        return "minimal"
    elif effective <= 80:
        return "standard"
    else:
        return "extended"


def get_repair_kit_contents(
    distance_km: float,
    bike_type: str = "rennrad",
    intensity: str = "moderat",
    locale: str = "de",
) -> list[dict]:
    """Return a list of repair kit content dicts: [{"name": "..."}, ...]."""
    tier = _distance_tier(distance_km, intensity)

    # Build item ID list
    item_ids: list[str] = list(_MINIMAL_ITEMS)

    # Add bike-type minimal extras
    for extra_id in _BIKE_TYPE_MINIMAL_EXTRAS.get(bike_type, []):
        if extra_id not in item_ids:
            item_ids.append(extra_id)

    if tier in ("standard", "extended"):
        item_ids.extend(_STANDARD_EXTRAS)
        for extra_id in _BIKE_TYPE_EXTRAS.get(bike_type, []):
            if extra_id not in item_ids:
                item_ids.append(extra_id)

    if tier == "extended":
        item_ids.extend(_EXTENDED_EXTRAS)

    # Translate to names
    contents: list[dict] = []
    for item_id in item_ids:
        trans = get_repair_kit_translation(item_id, locale)
        name = trans["name"] if trans else item_id
        contents.append({"name": name})

    return contents
