from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_admin
from app.database import get_session
from app.models.app_info_content import AppInfoContent
from app.models.user import User
from app.schemas.app_info import (
    AppInfoContentAdminResponse,
    AppInfoContentCreate,
    AppInfoContentUpdate,
)

router = APIRouter()


@router.get("/app-info", response_model=list[AppInfoContentAdminResponse])
async def list_app_info(
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> list[AppInfoContentAdminResponse]:
    result = await session.execute(
        select(AppInfoContent).order_by(AppInfoContent.display_order)
    )
    items = result.scalars().all()
    return [AppInfoContentAdminResponse.from_model(i) for i in items]


@router.post(
    "/app-info",
    response_model=AppInfoContentAdminResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_app_info(
    data: AppInfoContentCreate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> AppInfoContentAdminResponse:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    item = AppInfoContent(
        section_key=data.sectionKey,
        title=data.title,
        body=data.body,
        image_url=data.imageUrl,
        display_order=data.displayOrder,
        is_published=data.isPublished,
        updated_at=now,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return AppInfoContentAdminResponse.from_model(item)


@router.put("/app-info/{item_id}", response_model=AppInfoContentAdminResponse)
async def update_app_info(
    item_id: int,
    data: AppInfoContentUpdate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> AppInfoContentAdminResponse:
    result = await session.execute(
        select(AppInfoContent).where(AppInfoContent.id == item_id)
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="App info content not found")

    update_data = data.model_dump(exclude_unset=True)
    field_map = {
        "sectionKey": "section_key",
        "imageUrl": "image_url",
        "displayOrder": "display_order",
        "isPublished": "is_published",
    }
    for camel, snake in field_map.items():
        if camel in update_data:
            update_data[snake] = update_data.pop(camel)
    for key, value in update_data.items():
        setattr(item, key, value)
    item.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await session.commit()
    await session.refresh(item)
    return AppInfoContentAdminResponse.from_model(item)


@router.delete("/app-info/{item_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_app_info(
    item_id: int,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> None:
    result = await session.execute(
        select(AppInfoContent).where(AppInfoContent.id == item_id)
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="App info content not found")
    await session.delete(item)
    await session.commit()
