from pydantic import BaseModel


class RideLocationSchema(BaseModel):
    address: str
    lat: float | None = None
    lon: float | None = None


class DayStopSchema(BaseModel):
    location: RideLocationSchema
    plannedKm: float | None = None


class RideInputSchema(BaseModel):
    location: RideLocationSchema
    startDate: str  # ISO date YYYY-MM-DD
    startTime: str  # HH:MM
    endDate: str | None = None
    isMultiDay: bool = False
    bikeType: str
    intensity: str
    distanceKm: float | None = None
    elevationMeters: float | None = None
    dayStops: list[DayStopSchema] = []
