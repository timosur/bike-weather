from fastapi import APIRouter, Depends, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_locale
from app.database import get_session
from app.models import FaqItem
from app.schemas.faq import FaqItemResponse
from app.services.translation import get_translations

router = APIRouter(prefix="/faq", tags=["faq"])


@router.get("", response_model=list[FaqItemResponse])
async def list_faq(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> list[FaqItemResponse]:
    locale = get_locale(request)
    result = await session.execute(
        select(FaqItem)
        .where(FaqItem.is_published == True)  # noqa: E712
        .order_by(FaqItem.display_order)
    )
    items = result.scalars().all()
    trans = await get_translations(
        session, "faq_item", [i.id for i in items], locale,
        ["question", "answer", "category"],
    )
    return [
        FaqItemResponse(
            id=i.id,
            question=trans.get(i.id, {}).get("question", i.question),
            answer=trans.get(i.id, {}).get("answer", i.answer),
            category=trans.get(i.id, {}).get("category", i.category),
        )
        for i in items
    ]
