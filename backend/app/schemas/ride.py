from typing import Literal

from pydantic import BaseModel, model_validator


class RideLocationSchema(BaseModel):
    address: str | None = None
    lat: float | None = None
    lon: float | None = None


class WaypointSchema(BaseModel):
    location: RideLocationSchema
    type: Literal["stop", "sleep"] = "stop"
    name: str | None = None
    plannedKm: float | None = None
    startTime: str | None = None  # HH:MM — departure time after sleep


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
