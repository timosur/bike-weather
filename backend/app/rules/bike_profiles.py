"""Bike-type-specific clothing overrides.

Each bike type has a profile that maps generic clothing item IDs to
bike-specific variants (different name, icon, reason).  The weather
thresholds in clothing_rules.py stay the same — only the *what* changes.
"""

from typing import TypedDict


class BikeOverride(TypedDict, total=False):
    """Override fields for a clothing item when a specific bike type is selected."""

    id: str  # replacement translation key
    icon: str  # replacement icon (if different)


# Maps (generic_item_id, bike_type) → override.
# Items not listed here keep their generic version.
BIKE_CLOTHING_OVERRIDES: dict[tuple[str, str], BikeOverride] = {
    # ── SHORTS (warm weather ≥15°C) ─────────────────────────────────
    ("cl-shorts", "rennrad"): {"id": "cl-shorts-rennrad"},
    ("cl-shorts", "gravel"): {"id": "cl-shorts-gravel"},
    ("cl-shorts", "mtb"): {"id": "cl-shorts-mtb"},
    ("cl-shorts", "city"): {"id": "cl-shorts-city"},
    # ── PADDED TIGHTS (5–14°C) ──────────────────────────────────────
    ("cl-padded-tights", "rennrad"): {"id": "cl-padded-tights-rennrad"},
    ("cl-padded-tights", "gravel"): {"id": "cl-padded-tights-gravel"},
    ("cl-padded-tights", "mtb"): {"id": "cl-padded-tights-mtb"},
    ("cl-padded-tights", "city"): {"id": "cl-padded-tights-city"},
    # ── THERMAL TIGHTS (<5°C) ───────────────────────────────────────
    ("cl-thermal-tights", "rennrad"): {"id": "cl-thermal-tights-rennrad"},
    ("cl-thermal-tights", "gravel"): {"id": "cl-thermal-tights-gravel"},
    ("cl-thermal-tights", "mtb"): {"id": "cl-thermal-tights-mtb"},
    ("cl-thermal-tights", "city"): {"id": "cl-thermal-tights-city"},
    # ── SHORT JERSEY (≥20°C) ────────────────────────────────────────
    ("cl-jersey-short", "rennrad"): {"id": "cl-jersey-short-rennrad"},
    ("cl-jersey-short", "gravel"): {"id": "cl-jersey-short-gravel"},
    ("cl-jersey-short", "mtb"): {"id": "cl-jersey-short-mtb"},
    ("cl-jersey-short", "city"): {"id": "cl-jersey-short-city"},
    # ── LONG JERSEY (<10°C) ─────────────────────────────────────────
    ("cl-jersey-long", "rennrad"): {"id": "cl-jersey-long-rennrad"},
    ("cl-jersey-long", "gravel"): {"id": "cl-jersey-long-gravel"},
    ("cl-jersey-long", "mtb"): {"id": "cl-jersey-long-mtb"},
    ("cl-jersey-long", "city"): {"id": "cl-jersey-long-city"},
    # ── LIGHT LONG JERSEY (10–19°C) ─────────────────────────────────
    ("cl-jersey-long-light", "rennrad"): {"id": "cl-jersey-long-light-rennrad"},
    ("cl-jersey-long-light", "gravel"): {"id": "cl-jersey-long-light-gravel"},
    ("cl-jersey-long-light", "mtb"): {"id": "cl-jersey-long-light-mtb"},
    ("cl-jersey-long-light", "city"): {"id": "cl-jersey-long-light-city"},
    # ── BASE LAYER – MERINO (<10°C) ─────────────────────────────────
    ("cl-base-merino", "rennrad"): {"id": "cl-base-merino-rennrad"},
    ("cl-base-merino", "gravel"): {"id": "cl-base-merino-gravel"},
    ("cl-base-merino", "mtb"): {"id": "cl-base-merino-mtb"},
    ("cl-base-merino", "city"): {"id": "cl-base-merino-city"},
    # ── BASE LAYER – WICKING (≥10°C) ────────────────────────────────
    ("cl-base-wicking", "rennrad"): {"id": "cl-base-wicking-rennrad"},
    ("cl-base-wicking", "gravel"): {"id": "cl-base-wicking-gravel"},
    ("cl-base-wicking", "mtb"): {"id": "cl-base-wicking-mtb"},
    ("cl-base-wicking", "city"): {"id": "cl-base-wicking-city"},
    # ── SHOES ────────────────────────────────────────────────────────
    ("cl-shoes", "rennrad"): {"id": "cl-shoes-rennrad"},
    ("cl-shoes", "gravel"): {"id": "cl-shoes-gravel"},
    ("cl-shoes", "mtb"): {"id": "cl-shoes-mtb"},
    ("cl-shoes", "city"): {"id": "cl-shoes-city"},
    # ── LIGHT GLOVES (≥10°C) ────────────────────────────────────────
    ("cl-gloves-light", "rennrad"): {"id": "cl-gloves-light-rennrad"},
    ("cl-gloves-light", "gravel"): {"id": "cl-gloves-light-gravel"},
    ("cl-gloves-light", "mtb"): {"id": "cl-gloves-light-mtb"},
    ("cl-gloves-light", "city"): {"id": "cl-gloves-light-city"},
    # ── WARM GLOVES (0–9°C) ─────────────────────────────────────────
    ("cl-gloves-warm", "rennrad"): {"id": "cl-gloves-warm-rennrad"},
    ("cl-gloves-warm", "gravel"): {"id": "cl-gloves-warm-gravel"},
    ("cl-gloves-warm", "mtb"): {"id": "cl-gloves-warm-mtb"},
    ("cl-gloves-warm", "city"): {"id": "cl-gloves-warm-city"},
    # ── JACKET – OUTER LAYER ────────────────────────────────────────
    ("cl-rain-jacket", "rennrad"): {"id": "cl-rain-jacket-rennrad"},
    ("cl-rain-jacket", "gravel"): {"id": "cl-rain-jacket-gravel"},
    ("cl-rain-jacket", "mtb"): {"id": "cl-rain-jacket-mtb"},
    ("cl-rain-jacket", "city"): {"id": "cl-rain-jacket-city"},
}

# Arm/leg warmers — only for road & gravel; MTB/city get full-length items instead.
# (Used by clothing_rules.py to suppress warmers for MTB/city.)
BIKE_TYPES_WITH_WARMERS = {"rennrad", "gravel"}


def apply_bike_override(item: dict, bike_type: str) -> dict:
    """Return a copy of *item* with bike-type-specific ID override applied.

    The caller (clothing_rules.py) will then look up the overridden ID
    in translations to get the bike-specific name & reason.  If there is
    no override for this (item_id, bike_type) combo, the item is returned
    unchanged.
    """
    key = (item["id"], bike_type)
    override = BIKE_CLOTHING_OVERRIDES.get(key)
    if not override:
        return item
    new_item = dict(item)
    new_item["id"] = override.get("id", item["id"])
    if "icon" in override:
        new_item["icon"] = override["icon"]
    return new_item
