from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import FaqItem
from app.schemas.faq import FaqItemResponse

router = APIRouter(prefix="/faq", tags=["faq"])


@router.get("", response_model=list[FaqItemResponse])
async def list_faq(session: AsyncSession = Depends(get_session)) -> list[FaqItemResponse]:
    result = await session.execute(
        select(FaqItem)
        .where(FaqItem.is_published == True)  # noqa: E712
        .order_by(FaqItem.display_order)
    )
    items = result.scalars().all()
    return [
        FaqItemResponse(id=i.id, question=i.question, answer=i.answer, category=i.category)
        for i in items
    ]
