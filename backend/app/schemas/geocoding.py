from pydantic import BaseModel


class LocationSuggestionResponse(BaseModel):
    id: str
    displayText: str
    shortText: str
    lat: float
    lon: float
