"""Rule-based equipment recommendations from weather, distance, and time."""

from app.services.weather import WeatherForecast


def get_equipment_items(
    weather: WeatherForecast,
    distance_km: float | None,
    ride_start_time: str | None = None,
) -> list[dict]:
    """Return a list of equipment item dicts."""
    items: list[dict] = []
    dist = distance_km or 0
    precip = weather.precipitation_probability
    temp = weather.temp_feels_like

    # Always: water
    if temp < 5:
        items.append({
            "id": "eq-warm-drink",
            "name": "Insulated Bottle with Warm Drink",
            "reason": f"Warm fluids help maintain body temperature at {weather.temp_min:.0f}°C.",
        })
    items.append({
        "id": "eq-water",
        "name": "Water Bottle 750ml",
        "reason": f"Stay hydrated at {weather.temp_max:.0f}°C"
        + (f" over {dist:.0f} km" if dist > 0 else ""),
    })

    # UV protection
    if weather.uv_index >= 3:
        items.append({
            "id": "eq-sunscreen",
            "name": "Sunscreen SPF 30+",
            "reason": f"UV index {weather.uv_index:.0f} — sun protection recommended for multi-hour rides.",
        })

    # Lights: if ride could extend near sunset
    if ride_start_time and weather.sunset:
        items.append({
            "id": "eq-lights",
            "name": "Bike Lights (front + rear)",
            "reason": f"Sunset at {weather.sunset} — needed if returning later.",
        })

    # Rain gear
    if precip > 50:
        items.append({
            "id": "eq-mudguards",
            "name": "Mudguards",
            "reason": f"{precip:.0f}% precipitation — spray protection for rider and gear.",
        })
        items.append({
            "id": "eq-dry-bag",
            "name": "Dry Bag for Valuables",
            "reason": f"Protect phone and wallet at {precip:.0f}% rain chance.",
        })

    # Long rides
    if dist > 30:
        items.append({
            "id": "eq-repair-kit",
            "name": "Puncture Repair Kit",
            "reason": f"Essential kit for {dist:.0f} km ride.",
        })
    if dist > 50:
        items.append({
            "id": "eq-energy",
            "name": "Energy Bars",
            "reason": f"Sustained energy for {dist:.0f} km distance.",
        })

    return items
