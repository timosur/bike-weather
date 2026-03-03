from pydantic import BaseModel


class WeatherDataSchema(BaseModel):
    tempMin: float
    tempMax: float
    tempFeelsLike: float
    tempUnit: str = "°C"
    precipitation: float
    precipitationUnit: str = "%"
    windSpeed: float
    windUnit: str = "km/h"
    windDirection: str
    humidity: float
    uvIndex: float
    sunrise: str
    sunset: str
    icon: str
    description: str


class HourlyWeatherSchema(BaseModel):
    hour: str  # HH:MM
    datetime: str = ""  # ISO timestamp e.g. "2026-02-27T14:00"
    temp: float
    tempFeelsLike: float
    precipitationProbability: float
    precipitationMm: float
    windSpeed: float
    windDirection: str
    windGusts: float
    humidity: float
    weatherCode: int
    icon: str
    description: str
    isDay: bool


class ClothingAlternativeSchema(BaseModel):
    id: str
    name: str
    icon: str


class ClothingItemSchema(BaseModel):
    id: str
    name: str
    icon: str
    reason: str
    alternatives: list[ClothingAlternativeSchema] = []


class EquipmentSubItemSchema(BaseModel):
    name: str


class EquipmentItemSchema(BaseModel):
    id: str
    name: str
    reason: str
    category: str = "gear"  # "safety" | "gear" | "hydration" | "tools" | "nutrition"
    contents: list[EquipmentSubItemSchema] = []


class ConditionReasonSchema(BaseModel):
    code: str
    emoji: str
    label: str
    detail: str


class TipSchema(BaseModel):
    id: str
    category: str  # "heat" | "safety" | "comfort"
    message: str
    severity: str  # "info" | "warning" | "danger"


class DayForecastSchema(BaseModel):
    id: str
    date: str
    dayLabel: str
    location: str | None = None
    condition: str
    conditionReasons: list[ConditionReasonSchema] = []
    weather: WeatherDataSchema
    hourlyForecast: list[HourlyWeatherSchema] = []
    rideStartHour: int = 8
    rideEndHour: int = 10
    estimatedDurationMinutes: int = 120
    averageSpeedKmh: float = 20.0
    weatherSummary: str = ""
    clothingItems: list[ClothingItemSchema]
    equipment: list[EquipmentItemSchema]
    tips: list[TipSchema] = []


class RouteWaypointWeather(BaseModel):
    index: int
    lat: float
    lon: float
    distanceKm: float
    bearing: float
    temp: float
    icon: str
    windSpeed: float
    windDirection: str
    headwindComponent: float
    segmentStartKm: float | None = None
    segmentEndKm: float | None = None
    segmentDurationMinutes: float | None = None


class RouteSegment(BaseModel):
    startLat: float
    startLon: float
    endLat: float
    endLon: float
    color: str
    windEffect: str
    geometry: list[list[float]] | None = None


class RideReportSchema(BaseModel):
    id: str
    rideName: str
    startLocation: str
    destinationLocation: str | None = None
    ridingStyle: str
    totalDistance: float
    distanceUnit: str = "km"
    routeGeometry: list[list[float]] | None = None  # [[lat, lon], ...]
    waypoints: list[RouteWaypointWeather] | None = None
    routeSegments: list[RouteSegment] | None = None
    overallCondition: str
    overallConditionReasons: list[ConditionReasonSchema] = []
    shareUrl: str = ""
    days: list[DayForecastSchema]
    mergedClothingItems: list[ClothingItemSchema] = []
    mergedEquipment: list[EquipmentItemSchema] = []
    tips: list[TipSchema] = []
