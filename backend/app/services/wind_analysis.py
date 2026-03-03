import math
from dataclasses import dataclass
from typing import Literal

WindEffectLabel = Literal["headwind", "tailwind", "crosswind", "calm"]


@dataclass
class WindAnalysis:
    headwind_component: float  # km/h, positive = headwind
    crosswind_component: float  # km/h
    wind_effect: WindEffectLabel
    effective_speed_impact: float  # percentage, negative = slowdown


def analyze_wind(
    bearing_deg: float, wind_speed_kmh: float, wind_direction_deg: float
) -> WindAnalysis:
    """
    Analyze wind impact on a cyclist.
    
    bearing_deg: Travel direction (0=N, 90=E)
    wind_speed_kmh: Wind speed in km/h
    wind_direction_deg: Wind origin direction (0=from N, 90=from E)
    """
    if wind_speed_kmh < 3.0:
        return WindAnalysis(
            headwind_component=0.0,
            crosswind_component=0.0,
            wind_effect="calm",
            effective_speed_impact=0.0,
        )

    # Convert to radians
    # Wind direction is "from", so we use it directly with cos(wind - travel)
    # See reasoning: Headwind (opposing) occurs when wind_from = travel_dir (0 diff)
    # cos(0) = 1 -> Full headwind
    angle_rad = math.radians(wind_direction_deg - bearing_deg)
    
    headwind = wind_speed_kmh * math.cos(angle_rad)
    crosswind = wind_speed_kmh * math.sin(angle_rad)
    
    # Determine label
    # We prioritize headwind/tailwind if the component is significant
    abs_head = abs(headwind)
    abs_cross = abs(crosswind)
    
    if abs_head >= abs_cross:
        effect: WindEffectLabel = "headwind" if headwind > 0 else "tailwind"
    else:
        effect = "crosswind"
        
    # Heuristic: 1 km/h headwind ~= 1% speed loss
    # Capped at +/- 50% for sanity
    impact = -headwind
    impact = max(-50.0, min(50.0, impact))
    
    return WindAnalysis(
        headwind_component=round(headwind, 1),
        crosswind_component=round(crosswind, 1),
        wind_effect=effect,
        effective_speed_impact=round(impact, 1),
    )


def wind_exposure_factor(duration_minutes: float | None, distance_km: float | None) -> float:
    """Compute a wind exposure multiplier based on ride duration/distance.

    On longer rides wind impact compounds: muscles fatigue, sustained
    headwind drains energy reserves, and crosswind requires constant
    compensation.  The factor uses a smooth logistic curve so that:

    - Very short rides  (≤30 min / ≤15 km)  → ~1.0  (no amplification)
    - Medium rides       (~90 min / ~50 km)  → ~1.15
    - Long rides         (~3 h   / ~100 km)  → ~1.3
    - Very long rides    (≥5 h   / ≥200 km)  → approaches 1.5

    When both duration and distance are available the larger factor wins,
    so a slow 60 km gravel ride (3 h) and a fast 60 km road ride (1.5 h)
    are both scored fairly.
    """
    def _logistic(x: float, midpoint: float, steepness: float) -> float:
        """Scaled logistic: 0→1 mapped to 1.0→1.5."""
        return 1.0 + 0.5 / (1.0 + math.exp(-steepness * (x - midpoint)))

    factor_dur = 1.0
    factor_dist = 1.0

    if duration_minutes is not None and duration_minutes > 0:
        # midpoint at 150 min (2.5 h), steepness tuned for gentle curve
        factor_dur = _logistic(duration_minutes, 150.0, 0.02)

    if distance_km is not None and distance_km > 0:
        # midpoint at 80 km
        factor_dist = _logistic(distance_km, 80.0, 0.03)

    return round(max(factor_dur, factor_dist), 3)
