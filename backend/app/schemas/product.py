from pydantic import BaseModel


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
    price: float
    currency: str
    shopId: str
    affiliateUrl: str
    matchesZone: str | None
    matchesLabel: str
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
