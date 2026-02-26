"""Public endpoint for viewing shared ride reports."""

from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_locale
from app.database import get_session
from app.models.saved_route import SavedRoute
from app.rate_limit import limiter
from app.schemas.report import RideReportSchema
from app.schemas.ride import RideInputSchema, RideLocationSchema
from app.services.recommendations import build_report
from app.services.weather import WeatherServiceError

from fastapi import Depends

router = APIRouter(prefix="/shared", tags=["shared"])

# Map SavedRoute.riding_style → (bikeType, intensity) for re-generation
_STYLE_MAP: dict[str, tuple[str, str]] = {
    "Sporty": ("rennrad", "sportlich"),
    "Easy": ("city", "gemuetlich"),
    "Touring": ("gravel", "moderat"),
}


@router.get("/{token}", response_model=RideReportSchema)
@limiter.limit("10/minute")
async def get_shared_report(
    token: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> RideReportSchema:
    result = await session.execute(
        select(SavedRoute).where(SavedRoute.share_token == token)
    )
    route = result.scalars().first()
    if route is None:
        raise HTTPException(status_code=404, detail="Shared report not found")

    bike_type, intensity = _STYLE_MAP.get(route.riding_style, ("rennrad", "moderat"))

    now = datetime.now(timezone.utc)
    start_date = now.strftime("%Y-%m-%d")
    start_time = now.strftime("%H:%M")

    ride_input = RideInputSchema(
        location=RideLocationSchema(address=route.start_location),
        startDate=start_date,
        startTime=start_time,
        bikeType=bike_type,
        intensity=intensity,
        distanceKm=route.total_distance,
    )

    locale = get_locale(request)
    try:
        report = await build_report(ride_input, locale=locale)
    except WeatherServiceError:
        raise HTTPException(
            status_code=503,
            detail="Weather data is temporarily unavailable. Please try again shortly.",
            headers={"Retry-After": "30"},
        )
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))

    return report
