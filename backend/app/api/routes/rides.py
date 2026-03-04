from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from slowapi.util import get_remote_address
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_locale, get_optional_user
from app.database import get_session
from app.models.saved_route import SavedRoute
from app.models.user import User
from app.rate_limit import limiter
from app.schemas.report import RideReportSchema
from app.schemas.ride import RideInputSchema, RoutePreviewRequest, RoutePreviewSchema
from app.services.recommendations import build_report
from app.services.routing import routing_service
from app.services.turnstile import verify_turnstile
from app.services.weather import WeatherServiceError

router = APIRouter(prefix="/rides", tags=["rides"])


@router.post("/preview", response_model=RoutePreviewSchema)
@limiter.limit("60/minute")
async def preview_route(
    body: RoutePreviewRequest,
    request: Request,
) -> RoutePreviewSchema:
    try:
        wp_tuples = [(w[0], w[1]) for w in body.waypoints] if body.waypoints else None
        result = await routing_service.get_route(
            body.startLat, body.startLon, body.destLat, body.destLon, waypoints=wp_tuples
        )
        return RoutePreviewSchema(
            distanceKm=round(result.distance_km),
            durationMinutes=result.duration_minutes,
            geometry=result.geometry,
        )
    except Exception as e:
        raise HTTPException(status_code=503, detail="Routing unavailable") from e


@router.post("/report", response_model=RideReportSchema)
@limiter.limit("20/minute")
async def create_report(
    ride_input: RideInputSchema,
    request: Request,
    route_id: str | None = Query(None),
    user: User | None = Depends(get_optional_user),
    session: AsyncSession = Depends(get_session),
) -> RideReportSchema:
    # Turnstile token is optional for rides — frontend sends it after throttle threshold
    if ride_input.captcha_token:
        await verify_turnstile(ride_input.captcha_token, get_remote_address(request))
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
