"""Split a ride into legs at pause (same day) and sleep (next day) waypoints."""

from dataclasses import dataclass
from datetime import datetime, timedelta

from app.rules.speed_estimation import resolve_duration_minutes
from app.schemas.ride import RideInputSchema, WaypointSchema
from app.services.route_waypoints import split_route_km


@dataclass
class Leg:
    index: int
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    duration_min: int
    location_name: str
    lat: float
    lon: float
    start_km: float = 0.0
    end_km: float = 0.0
    split_type: str | None = None  # waypoint type the leg starts after
    split_waypoint: WaypointSchema | None = None

    @property
    def start_dt(self) -> datetime:
        return datetime.strptime(f"{self.date}T{self.start_time}", "%Y-%m-%dT%H:%M")

    @property
    def end_dt(self) -> datetime:
        return self.start_dt + timedelta(minutes=self.duration_min)

    @property
    def km(self) -> float:
        return self.end_km - self.start_km


def build_legs(
    ride: RideInputSchema,
    lat: float,
    lon: float,
    route_geometry: list | None,
    total_duration_min: int,
) -> list[Leg]:
    """Build legs in route order.

    Duration per leg: the split waypoint's `plannedKm` if set, else the total
    duration split by route distance, else the total duration (no geometry).
    """
    splits = [wp for wp in ride.waypoints if wp.type in ("pause", "sleep")]

    km_marks: list[float] = []
    if route_geometry and len(route_geometry) > 1:
        split_points = [
            (wp.location.lat if wp.location.lat is not None else lat,
             wp.location.lon if wp.location.lon is not None else lon)
            for wp in splits
        ]
        km_marks = split_route_km(
            [(pt[0], pt[1]) for pt in route_geometry], split_points
        )
    total_km = km_marks[-1] if km_marks else 0.0

    def duration(km: float, planned_km: float | None) -> int:
        if planned_km and planned_km > 0:
            return resolve_duration_minutes(
                None,
                planned_km,
                ride.bikeType,
                ride.intensity,
                ride.averageSpeedKmh,
                gravel_style=ride.gravelStyle,
            )
        if total_km > 0 and splits:
            return round(total_duration_min * km / total_km)
        return total_duration_min

    legs: list[Leg] = []
    date = datetime.strptime(ride.startDate, "%Y-%m-%d")
    for i in range(len(splits) + 1):
        wp = splits[i - 1] if i > 0 else None
        start_km = km_marks[i] if km_marks else 0.0
        end_km = km_marks[i + 1] if km_marks else 0.0
        if wp is None:
            start_time = ride.startTime
            name, leg_lat, leg_lon = ride.location.address or "", lat, lon
        else:
            if wp.type == "sleep":
                date += timedelta(days=1)
            start_time = wp.startTime or "08:00"
            name = wp.location.address or wp.name or ""
            leg_lat = wp.location.lat if wp.location.lat is not None else lat
            leg_lon = wp.location.lon if wp.location.lon is not None else lon
        legs.append(
            Leg(
                index=i,
                date=date.strftime("%Y-%m-%d"),
                start_time=start_time,
                duration_min=duration(end_km - start_km, wp.plannedKm if wp else None),
                location_name=name,
                lat=leg_lat,
                lon=leg_lon,
                start_km=start_km,
                end_km=end_km,
                split_type=wp.type if wp else None,
                split_waypoint=wp,
            )
        )
    return legs


def leg_for_km(legs: list[Leg], km: float) -> Leg:
    """The leg a route position belongs to (a boundary belongs to the later leg)."""
    return next((leg for leg in reversed(legs) if km >= leg.start_km), legs[0])


def leg_time_at(legs: list[Leg], km: float) -> datetime:
    """Estimated time the rider passes `km`, including pauses and overnights."""
    leg = leg_for_km(legs, km)
    if leg.km <= 0:
        return leg.start_dt
    fraction = min(max((km - leg.start_km) / leg.km, 0.0), 1.0)
    return leg.start_dt + timedelta(minutes=leg.duration_min * fraction)
