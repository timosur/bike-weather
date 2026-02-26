from datetime import datetime, timezone
from typing import Any

from sqlalchemy import Column
from sqlalchemy.dialects.postgresql import JSONB
from sqlmodel import Field, SQLModel


class SavedRoute(SQLModel, table=True):
    __tablename__ = "saved_routes"

    id: str = Field(primary_key=True)
    user_id: int = Field(foreign_key="users.id", index=True)
    name: str
    start_location: str
    total_distance: float
    distance_unit: str = Field(default="km")
    riding_style: str
    last_condition: str = Field(default="")
    last_used: datetime | None = Field(default=None)
    share_token: str | None = Field(default=None, unique=True, index=True)
    created_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
    # Full RideInput JSON for edit/restore functionality
    ride_input: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSONB, nullable=True)
    )
