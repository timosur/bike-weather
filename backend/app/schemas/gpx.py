from pydantic import BaseModel


class GpxLocationResponse(BaseModel):
    """Location with optional address from reverse geocoding."""
    address: str | None = None
    lat: float
    lon: float


class GpxImportResponse(BaseModel):
    """Response containing imported GPX route data."""
    name: str
    geometry: list[list[float]]  # [[lat, lon], ...]
    distanceKm: float
    startLocation: GpxLocationResponse
    endLocation: GpxLocationResponse
