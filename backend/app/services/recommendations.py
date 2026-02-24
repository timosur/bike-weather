"""Orchestrator: takes RideInput → fetches weather per day → runs rules → assembles RideReport."""

import uuid
from datetime import datetime, timedelta

from app.rules.clothing_rules import get_clothing_items
from app.rules.condition import compute_condition
from app.rules.equipment_rules import get_equipment_items
from app.rules.translations import (
    BIKE_LABELS,
    DAY_LABELS,
    INTENSITY_LABELS,
    RIDE_NAME_TEMPLATE,
    RIDING_STYLE_TEMPLATE,
    get_wmo_description,
)
from app.schemas.report import (
    ClothingAlternativeSchema,
    ClothingItemSchema,
    DayForecastSchema,
    EquipmentItemSchema,
    RideReportSchema,
    WeatherDataSchema,
)
from app.schemas.ride import RideInputSchema
from app.services.geocoding import geocoding_service
from app.services.weather import WeatherForecast, WeatherService, weather_service

# Condition severity ordering for "worst of" calculation
_CONDITION_ORDER = {"ideal": 0, "good": 1, "caution": 2, "not-recommended": 3}


def _worst_condition(conditions: list[str]) -> str:
    if not conditions:
        return "good"
    return max(conditions, key=lambda c: _CONDITION_ORDER.get(c, 1))


def _forecast_to_weather_schema(f: WeatherForecast, locale: str = "de") -> WeatherDataSchema:
    return WeatherDataSchema(
        tempMin=f.temp_min,
        tempMax=f.temp_max,
        tempFeelsLike=f.temp_feels_like,
        precipitation=f.precipitation_probability,
        windSpeed=f.wind_speed,
        windDirection=f.wind_direction,
        humidity=f.humidity,
        uvIndex=f.uv_index,
        sunrise=f.sunrise,
        sunset=f.sunset,
        icon=f.icon,
        description=get_wmo_description(f.weather_code, locale),
    )


def _clothing_dicts_to_schemas(items: list[dict]) -> list[ClothingItemSchema]:
    result = []
    for item in items:
        alts = [ClothingAlternativeSchema(**a) for a in item.get("alternatives", [])]
        result.append(
            ClothingItemSchema(
                id=item["id"],
                name=item["name"],
                icon=item["icon"],
                reason=item["reason"],
                alternatives=alts,
            )
        )
    return result


def _equipment_dicts_to_schemas(items: list[dict]) -> list[EquipmentItemSchema]:
    return [EquipmentItemSchema(**item) for item in items]


async def build_report(
    ride_input: RideInputSchema,
    ws: WeatherService | None = None,
    locale: str = "de",
) -> RideReportSchema:
    """Build a complete ride report from input."""
    ws = ws or weather_service

    lat = ride_input.location.lat
    lon = ride_input.location.lon
    if lat is None or lon is None:
        # Attempt to geocode the address
        results = await geocoding_service.search(ride_input.location.address, limit=1)
        if not results:
            raise ValueError(
                f"Could not geocode location: {ride_input.location.address}"
            )
        lat = results[0]["lat"]
        lon = results[0]["lon"]

    # Determine days to forecast
    start_date = datetime.strptime(ride_input.startDate, "%Y-%m-%d")
    day_locations: list[tuple[str, float, float, str]] = []

    if ride_input.isMultiDay and ride_input.dayStops:
        # Day 1: start location
        day_locations.append(
            (
                ride_input.location.address,
                lat,
                lon,
                ride_input.startDate,
            )
        )
        # Subsequent days: day stops
        for i, stop in enumerate(ride_input.dayStops):
            stop_date = (start_date + timedelta(days=i + 1)).strftime("%Y-%m-%d")
            stop_lat = stop.location.lat or lat
            stop_lon = stop.location.lon or lon
            day_locations.append(
                (
                    stop.location.address,
                    stop_lat,
                    stop_lon,
                    stop_date,
                )
            )
    else:
        # Single-day ride
        day_locations.append(
            (
                ride_input.location.address,
                lat,
                lon,
                ride_input.startDate,
            )
        )

    # Fetch weather and build days
    day_forecasts: list[DayForecastSchema] = []
    conditions: list[str] = []

    for day_idx, (location_name, day_lat, day_lon, date_str) in enumerate(
        day_locations
    ):
        forecast = await ws.fetch_forecast(day_lat, day_lon, date_str)
        condition = compute_condition(forecast)
        conditions.append(condition)

        clothing = get_clothing_items(
            forecast, ride_input.bikeType, ride_input.intensity, locale=locale
        )
        equipment = get_equipment_items(
            forecast,
            distance_km=ride_input.distanceKm,
            ride_start_time=ride_input.startTime,
            locale=locale,
        )

        day_label: str
        if len(day_locations) == 1:
            day_label = DAY_LABELS["today"][locale]
        else:
            day_label = DAY_LABELS["day"][locale].format(n=day_idx + 1)

        day_forecasts.append(
            DayForecastSchema(
                id=f"day-{day_idx + 1:03d}",
                date=date_str,
                dayLabel=day_label,
                location=location_name,
                condition=condition,
                weather=_forecast_to_weather_schema(forecast, locale),
                clothingItems=_clothing_dicts_to_schemas(clothing),
                equipment=_equipment_dicts_to_schemas(equipment),
            )
        )

    bike_label = BIKE_LABELS.get((ride_input.bikeType, locale), ride_input.bikeType)
    intensity_label = INTENSITY_LABELS.get((ride_input.intensity, locale), ride_input.intensity)

    return RideReportSchema(
        id=f"report-{uuid.uuid4().hex[:8]}",
        rideName=RIDE_NAME_TEMPLATE[locale].format(location=ride_input.location.address),
        startLocation=ride_input.location.address,
        ridingStyle=RIDING_STYLE_TEMPLATE[locale].format(bike=bike_label, intensity=intensity_label),
        totalDistance=ride_input.distanceKm or 0,
        overallCondition=_worst_condition(conditions),
        days=day_forecasts,
    )
