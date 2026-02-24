from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_locale, get_optional_user
from app.database import get_session
from app.models.saved_route import SavedRoute
from app.models.user import User
from app.schemas.report import RideReportSchema
from app.schemas.ride import RideInputSchema
from app.services.recommendations import build_report
from app.services.weather import WeatherServiceError

router = APIRouter(prefix="/rides", tags=["rides"])


@router.post("/report", response_model=RideReportSchema)
async def create_report(
    ride_input: RideInputSchema,
    request: Request,
    route_id: str | None = Query(None),
    user: User | None = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session),
) -> RideReportSchema:
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

    # Update saved route's last_condition and last_used if route_id provided
    if route_id and user:
        result = await session.execute(
            select(SavedRoute).where(
                SavedRoute.id == route_id,
                SavedRoute.user_id == user.id,
            )
        )
        route = result.scalars().first()
        if route:
            route.last_condition = report.overallCondition
            route.last_used = datetime.now(timezone.utc).replace(tzinfo=None)
            await session.commit()

    return report
