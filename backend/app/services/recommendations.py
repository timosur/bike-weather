"""Orchestrator: takes RideInput → fetches weather per day → runs rules → assembles RideReport."""

import math
import uuid
import asyncio
import logging
from dataclasses import replace as dc_replace
from datetime import datetime, timedelta

from app.rules.clothing_rules import get_clothing_items
from app.rules.condition import compute_condition
from app.rules.equipment_rules import get_equipment_items
from app.rules.speed_estimation import resolve_duration_minutes, get_average_speed
from app.rules.tips_rules import get_tips
from app.rules.translations import (
    BIKE_LABELS,
    DAY_LABELS,
    INTENSITY_LABELS,
    RIDE_NAME_TEMPLATE,
    RIDING_STYLE_TEMPLATE,
    get_condition_reason_translation,
    get_wmo_description,
)
from app.schemas.report import (
    ClothingAlternativeSchema,
    ClothingItemSchema,
    ConditionReasonSchema,
    DayForecastSchema,
    EquipmentItemSchema,
    EquipmentSubItemSchema,
    HourlyWeatherSchema,
    RideReportSchema,
    TipSchema,
    WeatherDataSchema,
    RouteWaypointWeather,
    RouteSegment,
)
from app.schemas.ride import RideInputSchema
from app.services.geocoding import geocoding_service
from app.services.routing import routing_service
from app.services.route_waypoints import sample_waypoints_by_direction, sample_weather_points
from app.services.wind_analysis import analyze_wind, wind_exposure_factor
from app.services.weather import (
    HourlyForecast,
    HourlyWeatherWindow,
    WeatherForecast,
    WeatherService,
    weather_service,
    wmo_to_icon,
    wmo_to_description,
)

logger = logging.getLogger(__name__)

# Condition severity ordering for "worst of" calculation
_CONDITION_ORDER = {"ideal": 0, "good": 1, "caution": 2, "not-recommended": 3}

# Weather summary templates keyed by locale
_SUMMARY_TEMPLATES: dict[str, dict[str, str]] = {
    "de": {
        "base": "{description}, {temp_range}°C (gefühlt {feels_like}°C).",
        "wind_light": "Leichter Wind ({wind_speed} km/h) aus {wind_dir}.",
        "wind_moderate": "Mäßiger Wind ({wind_speed} km/h) aus {wind_dir}.",
        "wind_strong": "Starker Wind ({wind_speed} km/h) aus {wind_dir}.",
        "precip_none": "Kein Regen erwartet.",
        "precip_low": "Geringe Regenwahrscheinlichkeit ({precip}%).",
        "precip_moderate": "Möglicher Regen ({precip}%).",
        "precip_high": "Hohe Regenwahrscheinlichkeit ({precip}%).",
    },
    "en": {
        "base": "{description}, {temp_range}°C (feels like {feels_like}°C).",
        "wind_light": "Light wind ({wind_speed} km/h) from {wind_dir}.",
        "wind_moderate": "Moderate wind ({wind_speed} km/h) from {wind_dir}.",
        "wind_strong": "Strong wind ({wind_speed} km/h) from {wind_dir}.",
        "precip_none": "No rain expected.",
        "precip_low": "Low chance of rain ({precip}%).",
        "precip_moderate": "Possible rain ({precip}%).",
        "precip_high": "High chance of rain ({precip}%).",
    },
}


def _build_weather_summary(forecast: WeatherForecast, locale: str = "de") -> str:
    """Build a short natural-language summary of ride-window weather."""
    tpl = _SUMMARY_TEMPLATES.get(locale, _SUMMARY_TEMPLATES["en"])

    temp_range = (
        f"{forecast.temp_min:.0f}–{forecast.temp_max:.0f}"
        if round(forecast.temp_min) != round(forecast.temp_max)
        else f"{forecast.temp_min:.0f}"
    )

    parts = [
        tpl["base"].format(
            description=forecast.description,
            temp_range=temp_range,
            feels_like=f"{forecast.temp_feels_like:.0f}",
        )
    ]

    # Wind
    ws = forecast.wind_speed
    wind_key = "wind_light" if ws < 20 else "wind_moderate" if ws < 40 else "wind_strong"
    parts.append(
        tpl[wind_key].format(wind_speed=f"{ws:.0f}", wind_dir=forecast.wind_direction)
    )

    # Precipitation
    pp = forecast.precipitation_probability
    if pp < 10:
        parts.append(tpl["precip_none"])
    elif pp < 30:
        parts.append(tpl["precip_low"].format(precip=f"{pp:.0f}"))
    elif pp < 60:
        parts.append(tpl["precip_moderate"].format(precip=f"{pp:.0f}"))
    else:
        parts.append(tpl["precip_high"].format(precip=f"{pp:.0f}"))

    return " ".join(parts)


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


def _hourly_to_schemas(
    hours: list[HourlyForecast], date_str: str = ""
) -> list[HourlyWeatherSchema]:
    return [
        HourlyWeatherSchema(
            hour=h.hour,
            datetime=f"{date_str}T{h.hour}" if date_str else "",
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
    return [
        EquipmentItemSchema(
            id=item["id"],
            name=item["name"],
            reason=item["reason"],
            category=item.get("category", "gear"),
            contents=[
                EquipmentSubItemSchema(name=c["name"]) for c in item.get("contents", [])
            ],
        )
        for item in items
    ]


def _format_condition_reasons(
    reasons: list,
    locale: str,
) -> list[ConditionReasonSchema]:
    """Convert ConditionReason objects to translated schemas."""
    from app.rules.condition import ConditionReason

    result: list[ConditionReasonSchema] = []
    for r in reasons:
        trans = get_condition_reason_translation(r.code, locale)
        label = trans["label"] if trans else r.code
        detail_template = trans["detail"] if trans else ""
        # Format detail with actual/threshold values
        try:
            detail = detail_template.format(
                actual=r.actual if r.actual is not None else 0,
                threshold=r.threshold if r.threshold is not None else 0,
            )
        except (KeyError, ValueError):
            detail = detail_template
        result.append(
            ConditionReasonSchema(
                code=r.code,
                emoji=r.emoji,
                label=label,
                detail=detail,
            )
        )
    return result


def _tips_to_schemas(tips: list[dict]) -> list[TipSchema]:
    """Convert tip dicts to TipSchema instances."""
    return [TipSchema(**t) for t in tips]


def _merge_tips_across_days(
    per_day_tips: list[list[TipSchema]],
    day_labels: list[str],
) -> list[TipSchema]:
    """Merge tips from all days, deduplicating by id."""
    seen: dict[str, tuple[TipSchema, set[int]]] = {}
    for day_idx, tips in enumerate(per_day_tips):
        for tip in tips:
            if tip.id in seen:
                seen[tip.id][1].add(day_idx)
            else:
                seen[tip.id] = (tip, {day_idx})

    merged: list[TipSchema] = []
    for tip_id, (tip, day_indices) in seen.items():
        if len(day_indices) < len(per_day_tips):
            day_names = ", ".join(day_labels[i] for i in sorted(day_indices))
            merged.append(
                tip.model_copy(update={"message": f"{tip.message} ({day_names})"})
            )
        else:
            merged.append(tip)
    return merged


# Clothing icon severity: higher = more protection. Used for merging multi-day items.
_CLOTHING_SEVERITY: dict[str, int] = {
    "jersey": 0,
    "jersey-long": 1,
    "base-layer": 1,
    "arm-warmers": 1,
    "pants-short": 0,
    "pants-long": 1,
    "leg-warmers": 1,
    "vest": 1,
    "jacket": 2,
    "rain-jacket": 3,
    "overpants": 2,
    "gloves-light": 0,
    "gloves-warm": 1,
    "gloves-waterproof": 2,
    "sunglasses": 1,
    "glasses": 1,
    "headband": 1,
    "helmet-cover": 2,
    "shoes": 1,
    "shoe-covers": 2,
    "socks": 1,
}


def _merge_clothing_across_days(
    per_day_clothing: list[list[ClothingItemSchema]],
    day_labels: list[str],
) -> list[ClothingItemSchema]:
    """Merge clothing recommendations from all days into a single packing list.

    For each body-zone icon, keep the most protective item and collect all
    unique items across days. If two days recommend different items for the
    same zone (e.g. light gloves vs warm gloves), both are included.
    """
    # Track items by their id → (item, set of day indices)
    seen: dict[str, tuple[ClothingItemSchema, set[int]]] = {}

    for day_idx, day_items in enumerate(per_day_clothing):
        for item in day_items:
            if item.id in seen:
                seen[item.id][1].add(day_idx)
            else:
                seen[item.id] = (item, {day_idx})

    # Build merged list, ordered by first appearance
    merged: list[ClothingItemSchema] = []
    for item_id, (item, day_indices) in seen.items():
        if len(day_indices) == len(per_day_clothing):
            # Item needed every day — keep original reason
            merged.append(item)
        else:
            # Item only needed on specific days — annotate reason
            day_names = ", ".join(day_labels[i] for i in sorted(day_indices))
            merged.append(
                item.model_copy(update={"reason": f"{item.reason} ({day_names})"})
            )

    return merged


def _merge_equipment_across_days(
    per_day_equipment: list[list[EquipmentItemSchema]],
    day_labels: list[str],
) -> list[EquipmentItemSchema]:
    """Merge equipment from all days into a union set."""
    seen: dict[str, tuple[EquipmentItemSchema, set[int]]] = {}

    for day_idx, day_items in enumerate(per_day_equipment):
        for item in day_items:
            if item.id in seen:
                seen[item.id][1].add(day_idx)
            else:
                seen[item.id] = (item, {day_idx})

    merged: list[EquipmentItemSchema] = []
    for item_id, (item, day_indices) in seen.items():
        if len(day_indices) == len(per_day_equipment):
            merged.append(item)
        else:
            day_names = ", ".join(day_labels[i] for i in sorted(day_indices))
            merged.append(
                item.model_copy(update={"reason": f"{item.reason} ({day_names})"})
            )

    return merged


def _build_route_chart_hours(
    route_weather: list[tuple],
    total_distance_km: float,
    avg_speed_kmh: float,
    ride_start_hour: int,
    chart_start: int,
    chart_end: int,
) -> list[HourlyForecast]:
    """For each chart hour, pick weather from the route point closest to rider position."""
    if not route_weather or avg_speed_kmh <= 0:
        return []

    ride_duration_hours = total_distance_km / avg_speed_kmh
    result = []
    for hour in range(chart_start, min(chart_end, 23) + 1):
        if hour < ride_start_hour:
            target_dist = 0.0
        elif hour >= ride_start_hour + ride_duration_hours:
            target_dist = total_distance_km
        else:
            hours_riding = hour - ride_start_hour
            target_dist = min(hours_riding * avg_speed_kmh, total_distance_km)

        _closest_wp, closest_window = min(
            route_weather,
            key=lambda pw: abs(pw[0].distance_from_start_km - target_dist),
        )

        hour_str = f"{hour:02d}:00"
        hour_weather = next(
            (h for h in closest_window.hours if h.hour == hour_str),
            None,
        )
        if hour_weather:
            result.append(hour_weather)

    return result


def _collect_route_ride_hours(
    route_weather: list[tuple],
    ride_start_h: int,
    ride_end_h: int,
) -> list[HourlyForecast]:
    """Collect ride-window hours from ALL route sample points for worst-case aggregation."""
    all_hours: list[HourlyForecast] = []
    for _wp, window in route_weather:
        for h in window.hours:
            hour_val = int(h.hour.split(":")[0])
            if ride_start_h <= hour_val <= ride_end_h:
                all_hours.append(h)
    return all_hours


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

    # Handle Destination & Routing
    route_geometry = None
    waypoints_schema = None
    route_segments_schema = None
    destination_addr = None

    if ride_input.destination:
        dest_lat = ride_input.destination.lat
        dest_lon = ride_input.destination.lon
        destination_addr = ride_input.destination.address

        if dest_lat is None or dest_lon is None:
            results = await geocoding_service.search(ride_input.destination.address, limit=1)
            if results:
                dest_lat = results[0]["lat"]
                dest_lon = results[0]["lon"]
        
        if dest_lat and dest_lon:
            try:
                # 1. Get Route
                route_result = await routing_service.get_route(lat, lon, dest_lat, dest_lon)
                
                # Override distance if not provided
                if not ride_input.distanceKm:
                    ride_input.distanceKm = round(route_result.distance_km)
                
                route_geometry = route_result.geometry
                
                # 2. Sample Waypoints
                raw_waypoints = sample_waypoints_by_direction(route_result.geometry)
                
                # 3. Calculate timing & fetch weather
                # Estimate average speed if not provided
                avg_speed = ride_input.averageSpeedKmh or 20.0
                if ride_input.durationMinutes and ride_input.distanceKm:
                    avg_speed = ride_input.distanceKm / (ride_input.durationMinutes / 60)
                
                start_dt = datetime.strptime(f"{ride_input.startDate}T{ride_input.startTime}", "%Y-%m-%dT%H:%M")

                sem = asyncio.Semaphore(5)

                async def _process_waypoint(wp):
                    async with sem:
                        hours_travel = wp.distance_from_start_km / avg_speed
                        arrival_time = start_dt + timedelta(hours=hours_travel)
                        try:
                            window = await ws.fetch_hourly_forecast(
                                wp.lat,
                                wp.lon,
                                arrival_time.strftime("%Y-%m-%d"),
                                arrival_time.hour,
                                arrival_time.hour,
                                locale,
                            )
                        except Exception:
                            logger.warning("Weather fetch failed for waypoint %d", wp.index)
                            return None

                        if not window.hours:
                            return None

                        weather = window.hours[0]
                        wind_result = analyze_wind(
                            bearing_deg=wp.bearing,
                            wind_speed_kmh=weather.wind_speed,
                            wind_direction_deg=weather.wind_direction_deg,
                        )
                        return {"wp": wp, "weather": weather, "wind": wind_result}

                wp_results = await asyncio.gather(*[_process_waypoint(wp) for wp in raw_waypoints])
                wp_results = [r for r in wp_results if r is not None]
                
                # 4. Build Schemas
                waypoints_schema = []
                route_segments_schema = []
                
                for i, res in enumerate(wp_results):
                    wp = res["wp"]
                    w = res["weather"]
                    wind = res["wind"]
                    
                    waypoints_schema.append(
                        RouteWaypointWeather(
                            index=wp.index,
                            lat=wp.lat,
                            lon=wp.lon,
                            distanceKm=wp.distance_from_start_km,
                            bearing=wp.bearing,
                            temp=w.temp,
                            icon=w.icon,
                            windSpeed=w.wind_speed,
                            windDirection=w.wind_direction,
                            headwindComponent=wind.headwind_component,
                            segmentStartKm=wp.segment_start_km,
                            segmentEndKm=wp.segment_end_km,
                            segmentDurationMinutes=(
                                round((wp.segment_end_km - wp.segment_start_km) / avg_speed * 60, 1)
                                if wp.segment_start_km is not None and wp.segment_end_km is not None and avg_speed > 0
                                else None
                            ),
                        )
                    )
                    
                    # Create segment using the segment's boundary geometry indices
                    start_idx = wp.segment_start_geom_idx if wp.segment_start_geom_idx is not None else wp.geometry_index
                    end_idx = wp.segment_end_geom_idx if wp.segment_end_geom_idx is not None else (
                        wp_results[i + 1]["wp"].geometry_index if i < len(wp_results) - 1 else len(route_geometry) - 1
                    )
                    segment_geom = [
                        list(pt) for pt in route_geometry[start_idx : end_idx + 1]
                    ]

                    color_map = {
                        "headwind": "#ef4444",
                        "tailwind": "#22c55e",
                        "crosswind": "#eab308",
                        "calm": "#3b82f6",
                    }
                    route_segments_schema.append(
                        RouteSegment(
                            startLat=wp.lat,
                            startLon=wp.lon,
                            endLat=segment_geom[-1][0] if segment_geom else wp.lat,
                            endLon=segment_geom[-1][1] if segment_geom else wp.lon,
                            geometry=segment_geom if len(segment_geom) >= 2 else None,
                            color=color_map.get(wind.wind_effect, "#94a3b8"),
                            windEffect=wind.wind_effect,
                        )
                    )

            except Exception as e:
                logger.error("Routing failed: %s", e)
                # Continue without routing (soft failure)

    # Pre-compute route weather sample points (used for route-aware forecasts)
    route_sample_points = None
    if route_geometry and ride_input.distanceKm and ride_input.distanceKm > 0:
        route_sample_points = sample_weather_points(
            [(pt[0], pt[1]) for pt in route_geometry],
            ride_input.distanceKm,
        )

    # Resolve ride duration (explicit > avg speed + distance > auto-estimated > default 2h)
    duration_minutes = resolve_duration_minutes(
        ride_input.durationMinutes,
        ride_input.distanceKm,
        ride_input.bikeType,
        ride_input.intensity,
        ride_input.averageSpeedKmh,
        gravel_style=ride_input.gravelStyle,
    )

    # Resolve average speed for display
    avg_speed = (
        ride_input.averageSpeedKmh
        if ride_input.averageSpeedKmh and ride_input.averageSpeedKmh > 0
        else get_average_speed(
            ride_input.bikeType, ride_input.intensity, ride_input.gravelStyle
        )
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
    # Per-day duration (minutes) and speed (km/h) parallel to day_locations
    day_durations: list[int] = []
    day_speeds: list[float] = []
    day_start_times: list[str] = []  # actual HH:MM start times

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
        day_durations.append(duration_minutes)
        day_speeds.append(avg_speed)
        day_start_times.append(ride_input.startTime or f"{start_hour:02d}:00")
        # Subsequent days: day stops — use per-stop date/time when provided
        for i, stop in enumerate(ride_input.dayStops):
            # Date: use explicit per-stop date, or fallback to start + (i+1) days
            if stop.startDate:
                stop_date = stop.startDate
            else:
                stop_date = (start_date + timedelta(days=i + 1)).strftime("%Y-%m-%d")
            # Start hour: use explicit per-stop time, or default 8:00
            try:
                day_start_hour = (
                    int(stop.startTime.split(":")[0]) if stop.startTime else 8
                )
            except (ValueError, IndexError):
                day_start_hour = 8
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
                    gravel_style=ride_input.gravelStyle,
                )
            else:
                day_duration = duration_minutes
            day_end_hour = min(day_start_hour + math.ceil(day_duration / 60), 23)
            day_locations.append(
                (
                    stop.location.address,
                    stop_lat,
                    stop_lon,
                    stop_date,
                    day_start_hour,
                    day_end_hour,
                )
            )
            day_durations.append(day_duration)
            day_speeds.append(avg_speed)
            day_start_times.append(stop.startTime or f"{day_start_hour:02d}:00")
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
        day_durations.append(duration_minutes)
        day_speeds.append(avg_speed)
        day_start_times.append(ride_input.startTime or f"{start_hour:02d}:00")

    # Fetch weather and build days
    day_forecasts: list[DayForecastSchema] = []
    conditions: list[str] = []
    all_condition_reasons: list[list] = []  # raw ConditionReason per day
    per_day_tips: list[list[TipSchema]] = []

    for day_idx, (
        location_name,
        day_lat,
        day_lon,
        date_str,
        ride_start_h,
        ride_end_h,
    ) in enumerate(day_locations):
        # Fetch full day (0-23) at start/stop location (always needed for sunrise/sunset/UV)
        full_day_window = await ws.fetch_hourly_forecast(
            day_lat, day_lon, date_str, 0, 23, locale=locale
        )

        # Route-aware weather: fetch at sample points along route (day 0 only)
        route_weather_data: list[tuple] | None = None
        if route_sample_points and day_idx == 0:
            sem_route = asyncio.Semaphore(5)

            async def _fetch_point_weather(pt, _date=date_str, _locale=locale):
                async with sem_route:
                    try:
                        window = await ws.fetch_hourly_forecast(
                            pt.lat, pt.lon, _date, 0, 23, locale=_locale
                        )
                        return (pt, window)
                    except Exception:
                        logger.warning(
                            "Route weather fetch failed at (%.2f, %.2f)", pt.lat, pt.lon
                        )
                        return None

            results = await asyncio.gather(
                *[_fetch_point_weather(pt) for pt in route_sample_points]
            )
            route_weather_data = [r for r in results if r is not None]
            if not route_weather_data:
                route_weather_data = None

        # Extract ride-window hours for rules aggregation
        if route_weather_data:
            ride_hours = _collect_route_ride_hours(
                route_weather_data, ride_start_h, ride_end_h
            )
        else:
            ride_hours = [
                h
                for h in full_day_window.hours
                if int(h.hour.split(":")[0]) >= ride_start_h
                and int(h.hour.split(":")[0]) <= ride_end_h
            ]

        # Compute chart display window
        is_multi_day = ride_input.isMultiDay and ride_input.dayStops
        if is_multi_day:
            # Multi-day: fixed 6:00–22:00 window for consistent chart width per day
            chart_start = 6
            chart_end = 22
        else:
            # Single-day: ride window ± 3 hours buffer
            chart_start = max(0, ride_start_h - 3)
            chart_end = min(ride_end_h + 3, 23)

        # Build chart hours: route-aware or start-location
        if route_weather_data and ride_input.distanceKm and avg_speed > 0:
            chart_hours = _build_route_chart_hours(
                route_weather_data,
                ride_input.distanceKm,
                avg_speed,
                ride_start_h,
                chart_start,
                chart_end,
            )
        else:
            chart_hours = [
                h
                for h in full_day_window.hours
                if chart_start <= int(h.hour.split(":")[0]) <= min(chart_end, 23)
            ]

        # If chart extends past midnight, fetch next-day hours
        if chart_end > 23:
            next_date = (
                datetime.strptime(date_str, "%Y-%m-%d") + timedelta(days=1)
            ).strftime("%Y-%m-%d")
            next_day_end = chart_end - 24  # e.g. 25 → 1
            # For past-midnight hours, use destination (last route point) or start location
            ext_lat = route_sample_points[-1].lat if route_sample_points else day_lat
            ext_lon = route_sample_points[-1].lon if route_sample_points else day_lon
            try:
                next_day_window = await ws.fetch_hourly_forecast(
                    ext_lat, ext_lon, next_date, 0, next_day_end, locale=locale
                )
                relabeled = [
                    dc_replace(h, hour=f"{int(h.hour.split(':')[0]) + 24}:00")
                    for h in next_day_window.hours
                ]
                chart_hours.extend(relabeled)
            except Exception:
                pass  # gracefully degrade — just show current day
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

            # Compute wind exposure factor for this day's ride segment
            day_duration = (ride_end_h - ride_start_h) * 60
            day_distance = ride_input.distanceKm
            if ride_input.isMultiDay and ride_input.dayStops and day_idx > 0:
                stop = ride_input.dayStops[day_idx - 1]
                day_distance = stop.plannedKm if stop.plannedKm else ride_input.distanceKm
            exposure = wind_exposure_factor(day_duration, day_distance)
            effective_wind = round(worst_wind * exposure, 1)

            forecast = WeatherForecast(
                temp_min=round(min(temps), 1),
                temp_max=round(max(temps), 1),
                temp_feels_like=worst_feels,
                precipitation_probability=worst_precip,
                wind_speed=effective_wind,
                wind_direction=wind_dir,
                humidity=worst_humidity,
                uv_index=full_day_window.summary.uv_index,
                sunrise=full_day_window.summary.sunrise,
                sunset=full_day_window.summary.sunset,
                weather_code=worst_wcode,
                icon=wmo_to_icon(worst_wcode),
                description=wmo_to_description(worst_wcode, locale),
            )
            # Keep raw wind for display, use effective wind for rules
            raw_wind_speed = worst_wind
        else:
            forecast = full_day_window.summary
            raw_wind_speed = forecast.wind_speed

        condition, reasons = compute_condition(forecast)
        conditions.append(condition)
        all_condition_reasons.append(reasons)

        clothing = get_clothing_items(
            forecast,
            ride_input.bikeType,
            ride_input.intensity,
            locale=locale,
            gravel_style=ride_input.gravelStyle,
        )
        equipment = get_equipment_items(
            forecast,
            distance_km=ride_input.distanceKm,
            ride_start_time=ride_input.startTime,
            ride_end_time=f"{ride_end_h:02d}:00",
            bike_type=ride_input.bikeType,
            intensity=ride_input.intensity,
            locale=locale,
            gravel_style=ride_input.gravelStyle,
        )

        tips = get_tips(
            forecast,
            locale,
            duration_minutes=duration_minutes,
            distance_km=ride_input.distanceKm,
        )
        day_tip_schemas = _tips_to_schemas(tips)
        per_day_tips.append(day_tip_schemas)

        # Build weather display schema with raw (measured) wind speed
        display_weather = _forecast_to_weather_schema(forecast, locale)
        display_weather.windSpeed = raw_wind_speed

        day_label: str
        if len(day_locations) == 1:
            day_label = DAY_LABELS["today"][locale]
        else:
            day_label = DAY_LABELS["day"][locale].format(n=day_idx + 1)

        # Compute actual start/end time strings (HH:MM) from start time + duration
        actual_start_time = day_start_times[day_idx]
        try:
            st_parts = actual_start_time.split(":")
            st_total_min = int(st_parts[0]) * 60 + int(st_parts[1])
        except (ValueError, IndexError):
            st_total_min = ride_start_h * 60
        et_total_min = min(st_total_min + day_durations[day_idx], 23 * 60 + 59)
        actual_end_time = f"{et_total_min // 60:02d}:{et_total_min % 60:02d}"

        day_forecasts.append(
            DayForecastSchema(
                id=f"day-{day_idx + 1:03d}",
                date=date_str,
                dayLabel=day_label,
                location=location_name,
                condition=condition,
                conditionReasons=_format_condition_reasons(reasons, locale),
                weather=display_weather,
                hourlyForecast=_hourly_to_schemas(chart_hours, date_str),
                rideStartHour=ride_start_h,
                rideEndHour=ride_end_h,
                rideStartTime=actual_start_time,
                rideEndTime=actual_end_time,
                estimatedDurationMinutes=day_durations[day_idx],
                averageSpeedKmh=round(day_speeds[day_idx], 1),
                weatherSummary=_build_weather_summary(forecast, locale),
                clothingItems=_clothing_dicts_to_schemas(clothing),
                equipment=_equipment_dicts_to_schemas(equipment),
                tips=day_tip_schemas,
            )
        )

    bike_label = BIKE_LABELS.get((ride_input.bikeType, locale), ride_input.bikeType)
    intensity_label = INTENSITY_LABELS.get(
        (ride_input.intensity, locale), ride_input.intensity
    )

    # Build merged packing list for multi-day tours
    merged_clothing: list[ClothingItemSchema] = []
    merged_equipment: list[EquipmentItemSchema] = []
    merged_tips: list[TipSchema] = []
    if len(day_forecasts) > 1:
        per_day_clothing = [d.clothingItems for d in day_forecasts]
        per_day_equipment = [d.equipment for d in day_forecasts]
        day_labels_list = [d.dayLabel for d in day_forecasts]
        merged_clothing = _merge_clothing_across_days(per_day_clothing, day_labels_list)
        merged_equipment = _merge_equipment_across_days(
            per_day_equipment, day_labels_list
        )
        merged_tips = _merge_tips_across_days(per_day_tips, day_labels_list)

    # Determine overall condition reasons (use worst day's reasons)
    overall_condition = _worst_condition(conditions)
    worst_day_idx = next(
        (i for i, c in enumerate(conditions) if c == overall_condition), 0
    )
    overall_reasons = _format_condition_reasons(
        all_condition_reasons[worst_day_idx] if all_condition_reasons else [],
        locale,
    )

    # Merge tips for single-day
    if len(day_forecasts) == 1:
        merged_tips = per_day_tips[0] if per_day_tips else []

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
        overallCondition=overall_condition,
        overallConditionReasons=overall_reasons,
        days=day_forecasts,
        mergedClothingItems=merged_clothing,
        mergedEquipment=merged_equipment,
        tips=merged_tips,
        routeGeometry=[list(pt) for pt in route_geometry] if route_geometry else None,
        waypoints=waypoints_schema,
        routeSegments=route_segments_schema,
        destinationLocation=destination_addr,
    )
