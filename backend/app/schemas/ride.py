import re
from typing import Literal

from pydantic import BaseModel, model_validator

_HHMM = re.compile(r"^([01]\d|2[0-3]):[0-5]\d$")


class RideLocationSchema(BaseModel):
    address: str | None = None
    lat: float | None = None
    lon: float | None = None


class WaypointSchema(BaseModel):
    location: RideLocationSchema
    type: Literal["stop", "pause", "sleep"] = "stop"
    name: str | None = None
    plannedKm: float | None = None
    startTime: str | None = None  # HH:MM — departure after pause (same day) or sleep (next day)


class DayStopSchema(BaseModel):
    """Legacy schema kept for backward compatibility deserialization."""
    location: RideLocationSchema
    plannedKm: float | None = None
    startDate: str | None = None  # ISO date YYYY-MM-DD
    startTime: str | None = None  # HH:MM


class RideInputSchema(BaseModel):
    location: RideLocationSchema
    startDate: str  # ISO date YYYY-MM-DD
    startTime: str  # HH:MM
    bikeType: str
    gravelStyle: str | None = None
    intensity: str
    distanceKm: float | None = None
    elevationMeters: float | None = None
    durationMinutes: float | None = None
    averageSpeedKmh: float | None = None
    waypoints: list[WaypointSchema] = []
    destination: RideLocationSchema | None = None
    importedGeometry: list[list[float]] | None = None
    captcha_token: str | None = None

    # Legacy fields accepted for backward compatibility
    isMultiDay: bool | None = None
    endDate: str | None = None
    dayStops: list[DayStopSchema] | None = None

    @model_validator(mode="after")
    def _migrate_legacy_day_stops(self) -> "RideInputSchema":
        """Convert old dayStops + isMultiDay format into unified waypoints."""
        if self.dayStops and not self.waypoints:
            migrated: list[WaypointSchema] = []
            for stop in self.dayStops:
                migrated.append(
                    WaypointSchema(
                        location=stop.location,
                        type="sleep",
                        plannedKm=stop.plannedKm,
                        startTime=stop.startTime,
                    )
                )
            self.waypoints = migrated
        # Clear legacy fields after migration
        self.dayStops = None
        self.isMultiDay = None
        self.endDate = None
        return self

    @model_validator(mode="after")
    def _validate_pause_departures(self) -> "RideInputSchema":
        """A pause must depart later than the start of the leg it ends."""
        leg_start = self.startTime
        for i, wp in enumerate(self.waypoints):
            if wp.type == "sleep":
                leg_start = wp.startTime or "08:00"
            elif wp.type == "pause":
                label = wp.name or wp.location.address or f"#{i + 1}"
                if not wp.startTime or not _HHMM.match(wp.startTime):
                    raise ValueError(
                        f"Pause waypoint {label} needs a departure time (HH:MM)"
                    )
                # Zero-padded HH:MM compares correctly as strings
                if wp.startTime <= leg_start:
                    raise ValueError(
                        f"Pause waypoint {label} must depart after {leg_start}"
                    )
                leg_start = wp.startTime
        return self


class RoutePreviewRequest(BaseModel):
    startLat: float
    startLon: float
    destLat: float
    destLon: float
    waypoints: list[list[float]] = []  # [[lat, lon], ...]


class RoutePreviewSchema(BaseModel):
    distanceKm: float
    durationMinutes: float
    geometry: list[list[float]]
