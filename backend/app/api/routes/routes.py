import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.database import get_session
from app.models.saved_route import SavedRoute
from app.models.user import User
from app.schemas.route import SavedRouteCreate, SavedRouteResponse, SavedRouteUpdate

router = APIRouter(prefix="/routes", tags=["routes"])


@router.get("", response_model=list[SavedRouteResponse])
async def list_routes(
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> list[SavedRoute]:
    result = await session.execute(
        select(SavedRoute)
        .where(SavedRoute.user_id == user.id)
        .order_by(SavedRoute.last_used.desc().nulls_last(), SavedRoute.created_at.desc())
    )
    return list(result.scalars().all())


@router.post("", response_model=SavedRouteResponse, status_code=status.HTTP_201_CREATED)
async def create_route(
    data: SavedRouteCreate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SavedRoute:
    route = SavedRoute(
        id=str(uuid.uuid4()),
        user_id=user.id,
        name=data.name,
        start_location=data.start_location,
        total_distance=data.total_distance,
        distance_unit=data.distance_unit,
        riding_style=data.riding_style,
    )
    session.add(route)
    await session.commit()
    await session.refresh(route)
    return route


@router.put("/{route_id}", response_model=SavedRouteResponse)
async def update_route(
    route_id: str,
    data: SavedRouteUpdate,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> SavedRoute:
    result = await session.execute(
        select(SavedRoute).where(SavedRoute.id == route_id)
    )
    route = result.scalars().first()
    if route is None or route.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")

    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(route, field, value)
    await session.commit()
    await session.refresh(route)
    return route


@router.delete("/{route_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_route(
    route_id: str,
    user: User = Depends(get_current_user),
    session: AsyncSession = Depends(get_session),
) -> None:
    result = await session.execute(
        select(SavedRoute).where(SavedRoute.id == route_id)
    )
    route = result.scalars().first()
    if route is None or route.user_id != user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")

    await session.delete(route)
    await session.commit()
