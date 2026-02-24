from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_admin
from app.database import get_session
from app.models.about_content import AboutContent
from app.models.user import User
from app.schemas.about import (
    AboutContentAdminResponse,
    AboutContentCreate,
    AboutContentUpdate,
)

router = APIRouter()


@router.get("/about", response_model=list[AboutContentAdminResponse])
async def list_about(
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> list[AboutContentAdminResponse]:
    result = await session.execute(
        select(AboutContent).order_by(AboutContent.display_order)
    )
    items = result.scalars().all()
    return [AboutContentAdminResponse.from_model(i) for i in items]


@router.post(
    "/about",
    response_model=AboutContentAdminResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_about(
    data: AboutContentCreate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> AboutContentAdminResponse:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    item = AboutContent(
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
    return AboutContentAdminResponse.from_model(item)


@router.put("/about/{about_id}", response_model=AboutContentAdminResponse)
async def update_about(
    about_id: int,
    data: AboutContentUpdate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> AboutContentAdminResponse:
    result = await session.execute(
        select(AboutContent).where(AboutContent.id == about_id)
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="About content not found")

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
    return AboutContentAdminResponse.from_model(item)


@router.delete("/about/{about_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_about(
    about_id: int,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> None:
    result = await session.execute(
        select(AboutContent).where(AboutContent.id == about_id)
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="About content not found")
    await session.delete(item)
    await session.commit()
