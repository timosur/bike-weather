from datetime import datetime
from typing import Any

from pydantic import BaseModel


class SavedRouteCreate(BaseModel):
    name: str
    start_location: str
    total_distance: float
    distance_unit: str = "km"
    riding_style: str
    ride_input: dict[str, Any] | None = None


class SavedRouteUpdate(BaseModel):
    name: str | None = None
    start_location: str | None = None
    total_distance: float | None = None
    distance_unit: str | None = None
    riding_style: str | None = None
    ride_input: dict[str, Any] | None = None


class SavedRouteResponse(BaseModel):
    id: str
    name: str
    start_location: str
    total_distance: float
    distance_unit: str
    riding_style: str
    last_condition: str
    last_used: datetime | None
    share_token: str | None
    created_at: datetime
    ride_input: dict[str, Any] | None = None

    model_config = {"from_attributes": True}


class ShareRouteResponse(BaseModel):
    share_token: str
    share_url: str
