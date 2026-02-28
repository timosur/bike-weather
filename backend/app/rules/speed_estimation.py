"""Estimate ride duration from distance, bike type, and riding intensity."""

import math

# Average speeds in km/h per (bike_type, intensity)
_SPEED_TABLE: dict[tuple[str, str], float] = {
    ("rennrad", "gemuetlich"): 22,
    ("rennrad", "moderat"): 27,
    ("rennrad", "sportlich"): 32,
    ("gravel", "gemuetlich"): 18,
    ("gravel", "moderat"): 23,
    ("gravel", "sportlich"): 28,
    ("gravel-road", "gemuetlich"): 20,
    ("gravel-road", "moderat"): 25,
    ("gravel-road", "sportlich"): 30,
    ("mtb", "gemuetlich"): 12,
    ("mtb", "moderat"): 16,
    ("mtb", "sportlich"): 20,
    ("city", "gemuetlich"): 14,
    ("city", "moderat"): 18,
    ("city", "sportlich"): 22,
}

DEFAULT_SPEED_KMH = 20.0
DEFAULT_DURATION_MINUTES = 120  # 2 hours when nothing is known


def get_average_speed(
    bike_type: str, intensity: str, gravel_style: str | None = None
) -> float:
    """Return estimated average speed in km/h."""
    key = bike_type
    if bike_type == "gravel" and gravel_style == "road":
        key = "gravel-road"
    return _SPEED_TABLE.get((key, intensity), DEFAULT_SPEED_KMH)


def estimate_duration_minutes(
    distance_km: float | None,
    bike_type: str,
    intensity: str,
    gravel_style: str | None = None,
) -> int | None:
    """Estimate ride duration in minutes, rounded to nearest 15 min.

    Returns None if distance is not provided.
    """
    if distance_km is None or distance_km <= 0:
        return None

    speed = get_average_speed(bike_type, intensity, gravel_style)
    raw_minutes = (distance_km / speed) * 60
    # Round to nearest 15 minutes, minimum 15
    return max(15, int(math.ceil(raw_minutes / 15) * 15))


def resolve_duration_minutes(
    explicit_duration: float | None,
    distance_km: float | None,
    bike_type: str,
    intensity: str,
    average_speed_kmh: float | None = None,
    gravel_style: str | None = None,
) -> int:
    """Return the ride duration to use, with fallback chain:

    1. User-provided explicit duration
    2. Calculated from distance + explicit average speed
    3. Auto-estimated from distance + bike type + intensity
    4. Default 120 minutes
    """
    if explicit_duration is not None and explicit_duration > 0:
        return int(explicit_duration)

    # If user provided an average speed, use it with distance
    if (
        average_speed_kmh is not None
        and average_speed_kmh > 0
        and distance_km
        and distance_km > 0
    ):
        raw_minutes = (distance_km / average_speed_kmh) * 60
        return max(15, int(math.ceil(raw_minutes / 15) * 15))

    estimated = estimate_duration_minutes(distance_km, bike_type, intensity, gravel_style)
    if estimated is not None:
        return estimated

    return DEFAULT_DURATION_MINUTES
