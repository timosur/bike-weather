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


class DayForecastSchema(BaseModel):
    id: str
    date: str
    dayLabel: str
    location: str | None = None
    condition: str
    weather: WeatherDataSchema
    clothingItems: list[ClothingItemSchema]
    equipment: list[EquipmentItemSchema]


class RideReportSchema(BaseModel):
    id: str
    rideName: str
    startLocation: str
    ridingStyle: str
    totalDistance: float
    distanceUnit: str = "km"
    overallCondition: str
    shareUrl: str = ""
    days: list[DayForecastSchema]
