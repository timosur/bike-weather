from datetime import datetime
from typing import Generic, TypeVar

from pydantic import BaseModel


T = TypeVar("T")


class PaginatedResponse(BaseModel, Generic[T]):
    items: list[T]
    total: int
    page: int
    pageSize: int


class TempRangeResponse(BaseModel):
    min: float
    max: float
    unit: str = "°C"


class WeatherSuitabilityResponse(BaseModel):
    tempRange: TempRangeResponse | None
    precipitation: str
    wind: str
    summary: str


class ProductResponse(BaseModel):
    id: str
    name: str
    categoryId: str
    imageUrl: str
    shopId: str
    affiliateUrl: str
    matchesZone: str | None
    matchesItemId: str | None
    matchesLabel: str
    bikeTypes: list[str]
    weather: WeatherSuitabilityResponse


class ShopResponse(BaseModel):
    id: str
    name: str
    logoUrl: str
    affiliateTag: str | None


class ProductCategoryResponse(BaseModel):
    id: str
    name: str
    icon: str
    productCount: int


class AffiliateDisclosureResponse(BaseModel):
    badgeLabel: str
    disclaimerText: str


class CategoryDetailResponse(BaseModel):
    category: ProductCategoryResponse
    products: list[ProductResponse]
    shops: list[ShopResponse]
    disclosure: AffiliateDisclosureResponse | None


# --- Hierarchical navigation schemas ---


class BikeTypeResponse(BaseModel):
    id: str
    name: str


class ZoneCategoryResponse(BaseModel):
    id: str
    name: str
    icon: str
    productCount: int


class ZoneResponse(BaseModel):
    id: str
    name: str
    productCount: int
    categories: list[ZoneCategoryResponse]


class ZoneCategoryDetailResponse(BaseModel):
    category: ProductCategoryResponse
    products: list[ProductResponse]
    shops: list[ShopResponse]
    disclosure: AffiliateDisclosureResponse | None


# --- Admin schemas ---


class ProductCreate(BaseModel):
    id: str
    name: str
    categoryId: str
    imageUrl: str
    shopId: str
    affiliateUrl: str
    matchesZone: str | None = None
    matchesItemId: str | None = None
    matchesLabel: str
    bikeTypes: list[str] = []
    weatherTempMin: float | None = None
    weatherTempMax: float | None = None
    weatherPrecipitation: str = "none"
    weatherWind: str = "none"
    weatherSummary: str = ""
    isPublished: bool = True


class ProductUpdate(BaseModel):
    name: str | None = None
    categoryId: str | None = None
    imageUrl: str | None = None
    shopId: str | None = None
    affiliateUrl: str | None = None
    matchesZone: str | None = None
    matchesItemId: str | None = None
    matchesLabel: str | None = None
    bikeTypes: list[str] | None = None
    weatherTempMin: float | None = None
    weatherTempMax: float | None = None
    weatherPrecipitation: str | None = None
    weatherWind: str | None = None
    weatherSummary: str | None = None
    isPublished: bool | None = None


class ProductAdminResponse(BaseModel):
    id: str
    name: str
    categoryId: str
    imageUrl: str
    shopId: str
    affiliateUrl: str
    matchesZone: str | None
    matchesItemId: str | None
    matchesLabel: str
    bikeTypes: list[str]
    weatherTempMin: float | None
    weatherTempMax: float | None
    weatherPrecipitation: str
    weatherWind: str
    weatherSummary: str
    isPublished: bool
    createdAt: datetime
    updatedAt: datetime

    @classmethod
    def from_model(
        cls, obj: object, bike_types: list[str] | None = None
    ) -> "ProductAdminResponse":
        return cls(
            id=getattr(obj, "id"),
            name=getattr(obj, "name"),
            categoryId=getattr(obj, "category_id"),
            imageUrl=getattr(obj, "image_url"),
            shopId=getattr(obj, "shop_id"),
            affiliateUrl=getattr(obj, "affiliate_url"),
            matchesZone=getattr(obj, "matches_zone"),
            matchesItemId=getattr(obj, "matches_item_id", None),
            matchesLabel=getattr(obj, "matches_label"),
            bikeTypes=bike_types if bike_types is not None else [],
            weatherTempMin=getattr(obj, "weather_temp_min"),
            weatherTempMax=getattr(obj, "weather_temp_max"),
            weatherPrecipitation=getattr(obj, "weather_precipitation"),
            weatherWind=getattr(obj, "weather_wind"),
            weatherSummary=getattr(obj, "weather_summary"),
            isPublished=getattr(obj, "is_published"),
            createdAt=getattr(obj, "created_at"),
            updatedAt=getattr(obj, "updated_at"),
        )


class CategoryCreate(BaseModel):
    id: str
    name: str
    slug: str
    description: str = ""
    icon: str
    displayOrder: int = 0


class CategoryUpdate(BaseModel):
    name: str | None = None
    slug: str | None = None
    description: str | None = None
    icon: str | None = None
    displayOrder: int | None = None


class CategoryAdminResponse(BaseModel):
    id: str
    name: str
    slug: str
    description: str
    icon: str
    displayOrder: int

    @classmethod
    def from_model(cls, obj: object) -> "CategoryAdminResponse":
        return cls(
            id=getattr(obj, "id"),
            name=getattr(obj, "name"),
            slug=getattr(obj, "slug"),
            description=getattr(obj, "description"),
            icon=getattr(obj, "icon"),
            displayOrder=getattr(obj, "display_order"),
        )


class ShopCreate(BaseModel):
    id: str
    name: str
    logoUrl: str
    affiliateTag: str | None = None
    baseUrl: str | None = None


class ShopUpdate(BaseModel):
    name: str | None = None
    logoUrl: str | None = None
    affiliateTag: str | None = None
    baseUrl: str | None = None


class ShopAdminResponse(BaseModel):
    id: str
    name: str
    logoUrl: str
    affiliateTag: str | None
    baseUrl: str | None

    @classmethod
    def from_model(cls, obj: object) -> "ShopAdminResponse":
        return cls(
            id=getattr(obj, "id"),
            name=getattr(obj, "name"),
            logoUrl=getattr(obj, "logo_url"),
            affiliateTag=getattr(obj, "affiliate_tag"),
            baseUrl=getattr(obj, "base_url", None),
        )


class BulkProductItem(BaseModel):
    id: str
    name: str
    categoryId: str
    imageUrl: str
    shopId: str
    affiliateUrl: str
    matchesZone: str | None = None
    matchesItemId: str | None = None
    matchesLabel: str
    bikeTypes: list[str] | None = None
    weatherTempMin: float | None = None
    weatherTempMax: float | None = None
    weatherPrecipitation: str = "none"
    weatherWind: str = "none"
    weatherSummary: str = ""
    isPublished: bool = True


class BulkProductResponse(BaseModel):
    created: int
    updated: int
    deleted: int = 0
    errors: list[str]


class CategoryOverviewItem(BaseModel):
    categoryId: str
    categoryName: str
    icon: str
    zone: str
    totalProducts: int
    publishedProducts: int
    unpublishedProducts: int
    newestProductAt: datetime | None
    oldestProductAt: datetime | None
    status: str  # "ok", "outdated", "empty"
