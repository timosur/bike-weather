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
