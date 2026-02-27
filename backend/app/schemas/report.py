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


class EquipmentItemSchema(BaseModel):
    id: str
    name: str
    reason: str


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
    clothingItems: list[ClothingItemSchema]
    equipment: list[EquipmentItemSchema]
    tips: list[TipSchema] = []


class RideReportSchema(BaseModel):
    id: str
    rideName: str
    startLocation: str
    ridingStyle: str
    totalDistance: float
    distanceUnit: str = "km"
    overallCondition: str
    overallConditionReasons: list[ConditionReasonSchema] = []
    shareUrl: str = ""
    days: list[DayForecastSchema]
    mergedClothingItems: list[ClothingItemSchema] = []
    mergedEquipment: list[EquipmentItemSchema] = []
    tips: list[TipSchema] = []
