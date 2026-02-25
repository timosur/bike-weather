"""Orchestrator: takes RideInput → fetches weather per day → runs rules → assembles RideReport."""

import math
import uuid
from datetime import datetime, timedelta

from app.rules.clothing_rules import get_clothing_items
from app.rules.condition import compute_condition
from app.rules.equipment_rules import get_equipment_items
from app.rules.speed_estimation import resolve_duration_minutes
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
    HourlyWeatherSchema,
    RideReportSchema,
    WeatherDataSchema,
)
from app.schemas.ride import RideInputSchema
from app.services.geocoding import geocoding_service
from app.services.weather import (
    HourlyForecast,
    HourlyWeatherWindow,
    WeatherForecast,
    WeatherService,
    weather_service,
)

# Condition severity ordering for "worst of" calculation
_CONDITION_ORDER = {"ideal": 0, "good": 1, "caution": 2, "not-recommended": 3}


def _worst_condition(conditions: list[str]) -> str:
    if not conditions:
        return "good"
    return max(conditions, key=lambda c: _CONDITION_ORDER.get(c, 1))


def _forecast_to_weather_schema(
    f: WeatherForecast, locale: str = "de"
) -> WeatherDataSchema:
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


def _hourly_to_schemas(hours: list[HourlyForecast]) -> list[HourlyWeatherSchema]:
    return [
        HourlyWeatherSchema(
            hour=h.hour,
            temp=h.temp,
            tempFeelsLike=h.temp_feels_like,
            precipitationProbability=h.precipitation_probability,
            precipitationMm=h.precipitation_mm,
            windSpeed=h.wind_speed,
            windDirection=h.wind_direction,
            windGusts=h.wind_gusts,
            humidity=h.humidity,
            weatherCode=h.weather_code,
            icon=h.icon,
            description=h.description,
            isDay=h.is_day,
        )
        for h in hours
    ]


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

    # Resolve ride duration (explicit > avg speed + distance > auto-estimated > default 2h)
    duration_minutes = resolve_duration_minutes(
        ride_input.durationMinutes,
        ride_input.distanceKm,
        ride_input.bikeType,
        ride_input.intensity,
        ride_input.averageSpeedKmh,
    )

    # Parse start hour from startTime
    try:
        start_hour = int(ride_input.startTime.split(":")[0])
    except (ValueError, IndexError):
        start_hour = 8

    # Determine days to forecast
    start_date = datetime.strptime(ride_input.startDate, "%Y-%m-%d")
    # (location_name, lat, lon, date, ride_start_hour, ride_end_hour)
    day_locations: list[tuple[str, float, float, str, int, int]] = []

    if ride_input.isMultiDay and ride_input.dayStops:
        # Day 1: start location
        end_hour_day1 = min(start_hour + math.ceil(duration_minutes / 60), 23)
        day_locations.append(
            (
                ride_input.location.address,
                lat,
                lon,
                ride_input.startDate,
                start_hour,
                end_hour_day1,
            )
        )
        # Subsequent days: day stops — assume 8:00 start, use per-day km if available
        for i, stop in enumerate(ride_input.dayStops):
            stop_date = (start_date + timedelta(days=i + 1)).strftime("%Y-%m-%d")
            stop_lat = stop.location.lat or lat
            stop_lon = stop.location.lon or lon
            # Estimate per-day duration from planned km if available
            if stop.plannedKm and stop.plannedKm > 0:
                day_duration = resolve_duration_minutes(
                    None,
                    stop.plannedKm,
                    ride_input.bikeType,
                    ride_input.intensity,
                    ride_input.averageSpeedKmh,
                )
            else:
                day_duration = duration_minutes
            day_end_hour = min(8 + math.ceil(day_duration / 60), 23)
            day_locations.append(
                (
                    stop.location.address,
                    stop_lat,
                    stop_lon,
                    stop_date,
                    8,
                    day_end_hour,
                )
            )
    else:
        # Single-day ride
        end_hour = min(start_hour + math.ceil(duration_minutes / 60), 23)
        day_locations.append(
            (
                ride_input.location.address,
                lat,
                lon,
                ride_input.startDate,
                start_hour,
                end_hour,
            )
        )

    # Fetch weather and build days
    day_forecasts: list[DayForecastSchema] = []
    conditions: list[str] = []

    for day_idx, (
        location_name,
        day_lat,
        day_lon,
        date_str,
        ride_start_h,
        ride_end_h,
    ) in enumerate(day_locations):
        # Fetch full day (0-23) for the chart
        full_day_window = await ws.fetch_hourly_forecast(
            day_lat, day_lon, date_str, 0, 23, locale=locale
        )
        # Extract ride-window subset for rules aggregation
        ride_hours = [
            h
            for h in full_day_window.hours
            if int(h.hour.split(":")[0]) >= ride_start_h
            and int(h.hour.split(":")[0]) <= ride_end_h
        ]
        # Build worst-case summary from ride window hours for rules
        if ride_hours:
            temps = [h.temp for h in ride_hours]
            feels = [h.temp_feels_like for h in ride_hours]
            worst_feels = round(min(feels), 1)
            worst_precip = max(h.precipitation_probability for h in ride_hours)
            worst_wind = max(h.wind_speed for h in ride_hours)
            worst_humidity = max(h.humidity for h in ride_hours)
            worst_wcode = max(h.weather_code for h in ride_hours)
            peak_wind_hour = max(ride_hours, key=lambda h: h.wind_speed)
            wind_dir = peak_wind_hour.wind_direction
            from app.services.weather import wmo_to_icon, wmo_to_description

            forecast = WeatherForecast(
                temp_min=round(min(temps), 1),
                temp_max=round(max(temps), 1),
                temp_feels_like=worst_feels,
                precipitation_probability=worst_precip,
                wind_speed=worst_wind,
                wind_direction=wind_dir,
                humidity=worst_humidity,
                uv_index=full_day_window.summary.uv_index,
                sunrise=full_day_window.summary.sunrise,
                sunset=full_day_window.summary.sunset,
                weather_code=worst_wcode,
                icon=wmo_to_icon(worst_wcode),
                description=wmo_to_description(worst_wcode, locale),
            )
        else:
            forecast = full_day_window.summary

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
                hourlyForecast=_hourly_to_schemas(full_day_window.hours),
                rideStartHour=ride_start_h,
                rideEndHour=ride_end_h,
                clothingItems=_clothing_dicts_to_schemas(clothing),
                equipment=_equipment_dicts_to_schemas(equipment),
            )
        )

    bike_label = BIKE_LABELS.get((ride_input.bikeType, locale), ride_input.bikeType)
    intensity_label = INTENSITY_LABELS.get(
        (ride_input.intensity, locale), ride_input.intensity
    )

    return RideReportSchema(
        id=f"report-{uuid.uuid4().hex[:8]}",
        rideName=RIDE_NAME_TEMPLATE[locale].format(
            location=ride_input.location.address
        ),
        startLocation=ride_input.location.address,
        ridingStyle=RIDING_STYLE_TEMPLATE[locale].format(
            bike=bike_label, intensity=intensity_label
        ),
        totalDistance=ride_input.distanceKm or 0,
        overallCondition=_worst_condition(conditions),
        days=day_forecasts,
    )
