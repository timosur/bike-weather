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
    LEG_TIPS,
    INTENSITY_LABELS,
    RIDE_NAME_TEMPLATE,
    RIDE_NAME_TEMPLATE_NO_DEST,
    RIDING_STYLE_TEMPLATE,
    format_time,
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
    UserWaypointSchema,
    WeatherDataSchema,
    RouteWaypointWeather,
    RouteSegment,
)
from app.schemas.ride import RideInputSchema
from app.services.geocoding import geocoding_service
from app.services.routing import routing_service
from app.services.ride_legs import Leg, build_legs, leg_for_km, leg_time_at
from app.services.route_waypoints import (
    RouteWaypoint,
    sample_waypoints_by_direction,
    sample_weather_points,
)
from app.services.wind_analysis import analyze_wind, wind_exposure_factor
from sqlalchemy.ext.asyncio import AsyncSession

from app.services.product_matching import (
    match_products_to_clothing,
    match_products_to_equipment,
)
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
    wind_key = (
        "wind_light" if ws < 20 else "wind_moderate" if ws < 40 else "wind_strong"
    )
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
        airQualityIndex=f.air_quality_index,
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
            uvIndex=h.uv_index,
            airQualityIndex=h.air_quality_index,
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


def _leg_ride_hours(leg: Leg, clamp: bool) -> tuple[int, int]:
    """(start_hour, end_hour) of a leg's ride window; unclamped end may exceed 23."""
    try:
        start_h = int(leg.start_time.split(":")[0])
    except (ValueError, IndexError):
        start_h = 8
    end_h = start_h + math.ceil(leg.duration_min / 60)
    return start_h, min(end_h, 23) if clamp else end_h


def _leg_chart_windows(
    legs: list[Leg], ride_windows: list[tuple[int, int]]
) -> list[tuple[int, int]]:
    """Chart hours per leg for multi-leg rides.

    Each date shows 06:00–22:00 (widened to fit its rides). Legs sharing a date
    split that window in the middle of the pause, so the timeline reads as one
    continuous day instead of repeating it per leg.
    """
    windows: list[tuple[int, int]] = []
    for i, (start_h, end_h) in enumerate(ride_windows):
        same_as_prev = i > 0 and legs[i - 1].date == legs[i].date
        same_as_next = i + 1 < len(legs) and legs[i + 1].date == legs[i].date
        chart_start = (
            windows[-1][1] + 1 if same_as_prev else min(6, start_h)
        )
        chart_end = (
            max((end_h + ride_windows[i + 1][0]) // 2, chart_start)
            if same_as_next
            else max(22, end_h)
        )
        windows.append((chart_start, min(chart_end, 23)))
    return windows


def _leg_tips(
    legs: list[Leg], days: list[DayForecastSchema], locale: str, hour12: bool = False
) -> list[TipSchema]:
    """Packing tips for later legs and warnings for pauses ending too early."""
    tips: list[TipSchema] = []
    first_ids = {c.id for c in days[0].clothingItems}
    first_feels = days[0].weather.tempFeelsLike
    for leg, day in zip(legs[1:], days[1:]):
        extra = [c.name for c in day.clothingItems if c.id not in first_ids]
        if extra:
            feels = day.weather.tempFeelsLike
            key = "pack_cooler" if feels < first_feels else "pack"
            tips.append(
                TipSchema(
                    id=f"pack-leg-{leg.index + 1}",
                    category="comfort",
                    severity="info",
                    message=LEG_TIPS[key][locale].format(
                        items=", ".join(extra), leg=day.dayLabel, temp=f"{feels:.0f}"
                    ),
                )
            )
    for prev, leg in zip(legs, legs[1:]):
        if leg.split_type == "pause" and leg.start_dt < prev.end_dt:
            wp = leg.split_waypoint
            tips.append(
                TipSchema(
                    id=f"early-departure-{leg.index}",
                    category="safety",
                    severity="warning",
                    message=LEG_TIPS["early_departure"][locale].format(
                        place=(wp.name or wp.location.address) if wp else "",
                        arrival=format_time(prev.end_dt.strftime("%H:%M"), hour12),
                    ),
                )
            )
    return tips


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
    session: AsyncSession | None = None,
) -> RideReportSchema:
    """Build a complete ride report from input."""
    ws = ws or weather_service

    lat = ride_input.location.lat
    lon = ride_input.location.lon
    if lat is None or lon is None:
        # Attempt to geocode the address
        if not ride_input.location.address:
            raise ValueError("Location must have either coordinates or an address")
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
    raw_waypoints = None
    destination_addr = None

    if ride_input.destination:
        dest_lat = ride_input.destination.lat
        dest_lon = ride_input.destination.lon
        destination_addr = ride_input.destination.address

        if dest_lat is None or dest_lon is None:
            if ride_input.destination.address:
                results = await geocoding_service.search(
                    ride_input.destination.address, limit=1
                )
                if results:
                    dest_lat = results[0]["lat"]
                    dest_lon = results[0]["lon"]

        if dest_lat and dest_lon:
            try:
                # Collect waypoint coordinates for routing
                wp_coords: list[tuple[float, float]] = []
                for wp in ride_input.waypoints:
                    wp_lat = wp.location.lat
                    wp_lon = wp.location.lon
                    if wp_lat is not None and wp_lon is not None:
                        wp_coords.append((wp_lat, wp_lon))

                # Use imported geometry if available, otherwise call OSRM
                if ride_input.importedGeometry:
                    from app.services.routing import RoutingService

                    route_result = RoutingService.route_from_geometry(
                        ride_input.importedGeometry
                    )
                else:
                    route_result = await routing_service.get_route(
                        lat,
                        lon,
                        dest_lat,
                        dest_lon,
                        waypoints=wp_coords if wp_coords else None,
                    )

                # Override distance if not provided
                if not ride_input.distanceKm:
                    ride_input.distanceKm = round(route_result.distance_km)

                route_geometry = route_result.geometry

                # 2. Sample Waypoints (weather fetched below, once legs are known)
                raw_waypoints = sample_waypoints_by_direction(route_result.geometry)

            except Exception as e:
                logger.error("Routing failed: %s", e)
                # Continue without routing (soft failure)

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

    # Split into legs at pause (same day) and sleep (next day) waypoints
    legs = build_legs(ride_input, lat, lon, route_geometry, duration_minutes)
    is_multi_day = len(legs) > 1
    has_pause = any(wp.type == "pause" for wp in ride_input.waypoints)

    # 3. Map route weather at the time the rider passes each point
    if raw_waypoints and route_geometry:
        sem = asyncio.Semaphore(5)

        async def _process_waypoint(wp):
            async with sem:
                arrival_time = leg_time_at(legs, wp.distance_from_start_km)
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

        wp_results = await asyncio.gather(
            *[_process_waypoint(wp) for wp in raw_waypoints]
        )
        wp_results = [r for r in wp_results if r is not None]

        # 4. Build Schemas
        waypoints_schema = []
        route_segments_schema = []

        for i, res in enumerate(wp_results):
            wp = res["wp"]
            w = res["weather"]
            wind = res["wind"]
            # Riding pace of the leg this segment belongs to
            seg_leg = leg_for_km(legs, wp.distance_from_start_km)
            seg_speed = (
                seg_leg.km / (seg_leg.duration_min / 60)
                if seg_leg.km > 0 and seg_leg.duration_min > 0
                else avg_speed
            )

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
                        round(
                            (wp.segment_end_km - wp.segment_start_km)
                            / seg_speed
                            * 60,
                            1,
                        )
                        if wp.segment_start_km is not None
                        and wp.segment_end_km is not None
                        and seg_speed > 0
                        else None
                    ),
                )
            )

            # Create segment using the segment's boundary geometry indices
            start_idx = (
                wp.segment_start_geom_idx
                if wp.segment_start_geom_idx is not None
                else wp.geometry_index
            )
            end_idx = (
                wp.segment_end_geom_idx
                if wp.segment_end_geom_idx is not None
                else (
                    wp_results[i + 1]["wp"].geometry_index
                    if i < len(wp_results) - 1
                    else len(route_geometry) - 1
                )
            )
            segment_geom = [list(pt) for pt in route_geometry[start_idx : end_idx + 1]]

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

    # Pre-compute route weather sample points (used for route-aware forecasts)
    route_sample_points = None
    if route_geometry and ride_input.distanceKm and ride_input.distanceKm > 0:
        route_sample_points = sample_weather_points(
            [(pt[0], pt[1]) for pt in route_geometry],
            ride_input.distanceKm,
        )

    # Fetch weather and build one report entry per leg
    day_forecasts: list[DayForecastSchema] = []
    conditions: list[str] = []
    all_condition_reasons: list[list] = []  # raw ConditionReason per day
    per_day_tips: list[list[TipSchema]] = []
    sem_route = asyncio.Semaphore(5)

    async def _fetch_point_weather(pt, date_str):
        async with sem_route:
            try:
                window = await ws.fetch_hourly_forecast(
                    pt.lat, pt.lon, date_str, 0, 23, locale=locale
                )
                return (pt, window)
            except Exception:
                logger.warning(
                    "Route weather fetch failed at (%.2f, %.2f)", pt.lat, pt.lon
                )
                return None

    ride_windows = [_leg_ride_hours(leg, clamp=is_multi_day) for leg in legs]
    chart_windows = _leg_chart_windows(legs, ride_windows)

    for leg in legs:
        day_idx = leg.index
        date_str = leg.date
        ride_start_h, ride_end_h = ride_windows[day_idx]

        # Fetch full day (0-23) at leg start (always needed for sunrise/sunset/UV)
        full_day_window = await ws.fetch_hourly_forecast(
            leg.lat, leg.lon, date_str, 0, 23, locale=locale
        )

        # Route-aware weather: this leg's sample points, distances rebased to
        # the leg start. The leg start itself reuses full_day_window.
        route_weather_data: list[tuple] | None = None
        if route_sample_points:
            is_last = leg is legs[-1]
            leg_points = [
                dc_replace(pt, distance_from_start_km=pt.distance_from_start_km - leg.start_km)
                for pt in route_sample_points
                if pt.distance_from_start_km > leg.start_km
                and (is_last or pt.distance_from_start_km <= leg.end_km)
            ]
            results = await asyncio.gather(
                *[_fetch_point_weather(pt, date_str) for pt in leg_points]
            )
            start_point = RouteWaypoint(
                index=-1,
                lat=leg.lat,
                lon=leg.lon,
                distance_from_start_km=0.0,
                bearing=0.0,
                geometry_index=0,
            )
            route_weather_data = [(start_point, full_day_window)] + [
                r for r in results if r is not None
            ]

        # Extract ride-window hours for rules aggregation
        # For overnight rides (ride_end_h > 23), collect current-day portion first;
        # next-day hours are appended after the next-day fetch below.
        if route_weather_data:
            ride_hours = _collect_route_ride_hours(
                route_weather_data, ride_start_h, min(ride_end_h, 23)
            )
        else:
            ride_hours = [
                h
                for h in full_day_window.hours
                if int(h.hour.split(":")[0]) >= ride_start_h
                and int(h.hour.split(":")[0]) <= min(ride_end_h, 23)
            ]

        # Compute chart display window
        if is_multi_day:
            chart_start, chart_end = chart_windows[day_idx]
        else:
            # Single-day: ride window ± 3 hours buffer (allow >23 for overnight)
            chart_start = max(0, ride_start_h - 3)
            chart_end = ride_end_h + 3

        # Build chart hours: route-aware or start-location
        leg_km = leg.km if leg.km > 0 else (ride_input.distanceKm or 0)
        leg_speed = leg_km / (leg.duration_min / 60) if leg.duration_min > 0 else 0
        if route_weather_data and leg_km > 0 and leg_speed > 0:
            chart_hours = _build_route_chart_hours(
                route_weather_data,
                leg_km,
                leg_speed,
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
            # For past-midnight hours, use the leg's last route point or its start
            ext_point = route_weather_data[-1][0] if route_weather_data else leg
            try:
                next_day_window = await ws.fetch_hourly_forecast(
                    ext_point.lat, ext_point.lon, next_date, 0, next_day_end, locale=locale
                )
                relabeled = [
                    dc_replace(h, hour=f"{int(h.hour.split(':')[0]) + 24}:00")
                    for h in next_day_window.hours
                ]
                chart_hours.extend(relabeled)
                # Extend ride_hours with next-day hours within ride window
                if ride_end_h > 23:
                    next_day_ride_end = ride_end_h - 24
                    ride_hours.extend(
                        h
                        for h in next_day_window.hours
                        if int(h.hour.split(":")[0]) <= next_day_ride_end
                    )
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

            # Compute wind exposure factor for this leg
            day_duration = (ride_end_h - ride_start_h) * 60
            planned_km = leg.split_waypoint.plannedKm if leg.split_waypoint else None
            day_distance = planned_km or leg_km or ride_input.distanceKm
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

        # Compute actual start/end time strings (HH:MM) from start time + duration
        actual_start_time = leg.start_time
        actual_end_time = leg.end_dt.strftime("%H:%M")
        leg_distance = leg_km or ride_input.distanceKm

        clothing = get_clothing_items(
            forecast,
            ride_input.bikeType,
            ride_input.intensity,
            locale=locale,
            gravel_style=ride_input.gravelStyle,
        )
        equipment = get_equipment_items(
            forecast,
            distance_km=leg_distance,
            ride_start_time=actual_start_time,
            ride_end_time=f"{ride_end_h % 24:02d}:00",
            bike_type=ride_input.bikeType,
            intensity=ride_input.intensity,
            locale=locale,
            gravel_style=ride_input.gravelStyle,
            hour12=ride_input.hour12,
        )

        tips = get_tips(
            forecast,
            locale,
            duration_minutes=leg.duration_min,
            distance_km=leg_distance,
        )
        day_tip_schemas = _tips_to_schemas(tips)
        per_day_tips.append(day_tip_schemas)

        # Build weather display schema with raw (measured) wind speed
        display_weather = _forecast_to_weather_schema(forecast, locale)
        display_weather.windSpeed = raw_wind_speed

        day_label: str
        if len(legs) == 1:
            day_label = DAY_LABELS["today"][locale]
        elif has_pause:
            day_label = DAY_LABELS["leg"][locale].format(
                n=day_idx + 1, time=format_time(actual_start_time, ride_input.hour12)
            )
        else:
            day_label = DAY_LABELS["day"][locale].format(n=day_idx + 1)

        day_forecasts.append(
            DayForecastSchema(
                id=f"day-{day_idx + 1:03d}",
                date=date_str,
                dayLabel=day_label,
                location=leg.location_name,
                condition=condition,
                conditionReasons=_format_condition_reasons(reasons, locale),
                weather=display_weather,
                hourlyForecast=_hourly_to_schemas(chart_hours, date_str),
                rideStartHour=ride_start_h,
                rideEndHour=ride_end_h,
                rideStartTime=actual_start_time,
                rideEndTime=actual_end_time,
                estimatedDurationMinutes=leg.duration_min,
                averageSpeedKmh=round(avg_speed, 1),
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
        merged_tips.extend(_leg_tips(legs, day_forecasts, locale, ride_input.hour12))

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

    # Build user waypoint schemas for the report
    user_waypoints_schema: list[UserWaypointSchema] | None = None
    if ride_input.waypoints:
        uwp = []
        for wp in ride_input.waypoints:
            if wp.location.lat is not None and wp.location.lon is not None:
                uwp.append(
                    UserWaypointSchema(
                        lat=wp.location.lat,
                        lon=wp.location.lon,
                        type=wp.type,
                        name=wp.name,
                    )
                )
        if uwp:
            user_waypoints_schema = uwp

    # Match products to clothing + equipment items (best-fit by zone + weather)
    product_recs = None
    if session:
        # Use the clothing items that will appear in the report
        final_clothing = clothing  # last day's raw dicts; available for single-day
        if merged_clothing:
            # Multi-day: convert merged ClothingItemSchema back to dicts for matching
            final_clothing = [{"id": c.id, "icon": c.icon} for c in merged_clothing]
        try:
            product_recs = await match_products_to_clothing(
                session, final_clothing, forecast
            )
        except Exception:
            logger.warning("Product matching failed, continuing without", exc_info=True)

        # Equipment product matching
        final_equipment = equipment  # last day's raw dicts
        if merged_equipment:
            final_equipment = [{"id": e.id} for e in merged_equipment]
        try:
            eq_matched = await match_products_to_equipment(
                session, final_equipment, forecast
            )
            if eq_matched and product_recs:
                product_recs.matched.update(eq_matched)
            elif eq_matched and not product_recs:
                # Build a minimal ProductRecommendationsSchema for equipment-only
                from app.services.product_matching import _build_product_recs_scaffold

                product_recs = await _build_product_recs_scaffold(session, eq_matched)
        except Exception:
            logger.warning(
                "Equipment product matching failed, continuing without", exc_info=True
            )

    return RideReportSchema(
        id=f"report-{uuid.uuid4().hex[:8]}",
        rideName=(
            RIDE_NAME_TEMPLATE[locale].format(
                start=ride_input.location.address or "",
                end=ride_input.destination.address or "",
            )
            if ride_input.destination and ride_input.destination.address
            else RIDE_NAME_TEMPLATE_NO_DEST[locale].format(
                location=ride_input.location.address or ""
            )
        ),
        startLocation=ride_input.location.address or "",
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
        userWaypoints=user_waypoints_schema,
        routeSegments=route_segments_schema,
        destinationLocation=destination_addr,
        productRecommendations=product_recs,
    )
