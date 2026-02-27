"""Tests for bike_profiles.py — bike-type-specific clothing overrides."""

from app.rules.bike_profiles import apply_bike_override, BIKE_TYPES_WITH_WARMERS


def test_rennrad_shorts_override() -> None:
    item = {
        "id": "cl-shorts",
        "icon": "pants-short",
        "name": "Generic",
        "reason": "test",
    }
    result = apply_bike_override(item, "rennrad")
    assert result["id"] == "cl-shorts-rennrad"
    assert result["icon"] == "pants-short"  # icon unchanged


def test_mtb_shorts_override() -> None:
    item = {
        "id": "cl-shorts",
        "icon": "pants-short",
        "name": "Generic",
        "reason": "test",
    }
    result = apply_bike_override(item, "mtb")
    assert result["id"] == "cl-shorts-mtb"


def test_city_jersey_override() -> None:
    item = {
        "id": "cl-jersey-short",
        "icon": "jersey",
        "name": "Generic",
        "reason": "test",
    }
    result = apply_bike_override(item, "city")
    assert result["id"] == "cl-jersey-short-city"


def test_no_override_for_unknown_combo() -> None:
    item = {"id": "cl-cycling-cap", "icon": "headband", "name": "Cap", "reason": "sun"}
    result = apply_bike_override(item, "rennrad")
    # cycling-cap has no bike-type override
    assert result["id"] == "cl-cycling-cap"
    assert result is item  # should return same object (no copy)


def test_original_item_not_mutated() -> None:
    item = {
        "id": "cl-shorts",
        "icon": "pants-short",
        "name": "Generic",
        "reason": "test",
    }
    result = apply_bike_override(item, "gravel")
    assert item["id"] == "cl-shorts"  # original unchanged
    assert result["id"] == "cl-shorts-gravel"


def test_warmers_set() -> None:
    assert "rennrad" in BIKE_TYPES_WITH_WARMERS
    assert "gravel" in BIKE_TYPES_WITH_WARMERS
    assert "mtb" not in BIKE_TYPES_WITH_WARMERS
    assert "city" not in BIKE_TYPES_WITH_WARMERS


def test_shoes_override_all_types() -> None:
    for bike_type in ["rennrad", "gravel", "mtb", "city"]:
        item = {"id": "cl-shoes", "icon": "shoes", "name": "Generic", "reason": "test"}
        result = apply_bike_override(item, bike_type)
        assert result["id"] == f"cl-shoes-{bike_type}"
