from fastapi import APIRouter, Query, Request

from app.rate_limit import limiter
from app.schemas.geocoding import LocationSuggestionResponse
from app.services.geocoding import geocoding_service

router = APIRouter(prefix="/geocoding", tags=["geocoding"])


@router.get("/search", response_model=list[LocationSuggestionResponse])
@limiter.limit("30/minute")
async def search_locations(
    request: Request,
    q: str = Query(..., min_length=1),
    limit: int = Query(5, ge=1, le=20),
) -> list[LocationSuggestionResponse]:
    results = await geocoding_service.search(q, limit=limit)
    return [LocationSuggestionResponse(**r) for r in results]


@router.get("/reverse", response_model=LocationSuggestionResponse | None)
@limiter.limit("20/minute")
async def reverse_geocode(
    request: Request,
    lat: float = Query(...),
    lon: float = Query(...),
) -> LocationSuggestionResponse | None:
    result = await geocoding_service.reverse(lat, lon)
    if result is None:
        return None
    return LocationSuggestionResponse(**result)
