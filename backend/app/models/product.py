from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class Product(SQLModel, table=True):
    __tablename__ = "products"

    id: str = Field(primary_key=True)
    name: str
    category_id: str = Field(foreign_key="product_categories.id", index=True)
    image_url: str
    price: float
    currency: str = Field(default="EUR")
    shop_id: str = Field(foreign_key="shops.id", index=True)
    affiliate_url: str
    matches_zone: str | None = Field(default=None)
    matches_label: str
    weather_temp_min: float | None = Field(default=None)
    weather_temp_max: float | None = Field(default=None)
    weather_precipitation: str = Field(default="none")
    weather_wind: str = Field(default="none")
    weather_summary: str = Field(default="")
    is_published: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
