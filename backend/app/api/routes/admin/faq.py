from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_admin
from app.database import get_session
from app.models.faq_item import FaqItem
from app.models.user import User
from app.schemas.faq import (
    FaqItemAdminResponse,
    FaqItemCreate,
    FaqItemUpdate,
    FaqReorderItem,
)

router = APIRouter()


@router.get("/faq", response_model=list[FaqItemAdminResponse])
async def list_faq(
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> list[FaqItemAdminResponse]:
    result = await session.execute(select(FaqItem).order_by(FaqItem.display_order))
    items = result.scalars().all()
    return [FaqItemAdminResponse.from_model(i) for i in items]


@router.post(
    "/faq", response_model=FaqItemAdminResponse, status_code=status.HTTP_201_CREATED
)
async def create_faq(
    data: FaqItemCreate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> FaqItemAdminResponse:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    item = FaqItem(
        id=data.id,
        question=data.question,
        answer=data.answer,
        category=data.category,
        display_order=data.displayOrder,
        is_published=data.isPublished,
        created_at=now,
        updated_at=now,
    )
    session.add(item)
    await session.commit()
    await session.refresh(item)
    return FaqItemAdminResponse.from_model(item)


@router.put("/faq/{faq_id}", response_model=FaqItemAdminResponse)
async def update_faq(
    faq_id: str,
    data: FaqItemUpdate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> FaqItemAdminResponse:
    result = await session.execute(select(FaqItem).where(FaqItem.id == faq_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="FAQ item not found")

    update_data = data.model_dump(exclude_unset=True)
    field_map = {"displayOrder": "display_order", "isPublished": "is_published"}
    for camel, snake in field_map.items():
        if camel in update_data:
            update_data[snake] = update_data.pop(camel)
    for key, value in update_data.items():
        setattr(item, key, value)
    item.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await session.commit()
    await session.refresh(item)
    return FaqItemAdminResponse.from_model(item)


@router.delete("/faq/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq(
    faq_id: str,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> None:
    result = await session.execute(select(FaqItem).where(FaqItem.id == faq_id))
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="FAQ item not found")
    await session.delete(item)
    await session.commit()


@router.put("/faq/reorder", response_model=list[FaqItemAdminResponse])
async def reorder_faq(
    items: list[FaqReorderItem],
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> list[FaqItemAdminResponse]:
    for reorder in items:
        result = await session.execute(select(FaqItem).where(FaqItem.id == reorder.id))
        item = result.scalars().first()
        if item:
            item.display_order = reorder.displayOrder
    await session.commit()

    result = await session.execute(select(FaqItem).order_by(FaqItem.display_order))
    all_items = result.scalars().all()
    return [FaqItemAdminResponse.from_model(i) for i in all_items]
