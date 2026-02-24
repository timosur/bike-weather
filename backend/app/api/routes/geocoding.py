from fastapi import APIRouter, Query

from app.schemas.geocoding import LocationSuggestionResponse
from app.services.geocoding import geocoding_service

router = APIRouter(prefix="/geocoding", tags=["geocoding"])


@router.get("/search", response_model=list[LocationSuggestionResponse])
async def search_locations(
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
) -> list[LocationSuggestionResponse]:
    results = await geocoding_service.search(q, limit=limit)
    return [LocationSuggestionResponse(**r) for r in results]


@router.get("/reverse", response_model=LocationSuggestionResponse | None)
async def reverse_geocode(
    lat: float = Query(...),
    lon: float = Query(...),
) -> LocationSuggestionResponse | None:
    result = await geocoding_service.reverse(lat, lon)
    if result is None:
        return None
    return LocationSuggestionResponse(**result)
