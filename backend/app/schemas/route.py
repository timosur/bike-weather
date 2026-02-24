from datetime import datetime

from pydantic import BaseModel


class SavedRouteCreate(BaseModel):
    name: str
    start_location: str
    total_distance: float
    distance_unit: str = "km"
    riding_style: str


class SavedRouteUpdate(BaseModel):
    name: str | None = None
    start_location: str | None = None
    total_distance: float | None = None
    distance_unit: str | None = None
    riding_style: str | None = None


class SavedRouteResponse(BaseModel):
    id: str
    name: str
    start_location: str
    total_distance: float
    distance_unit: str
    riding_style: str
    last_condition: str
    last_used: datetime | None
    created_at: datetime

    model_config = {"from_attributes": True}
