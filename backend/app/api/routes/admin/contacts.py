from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_admin
from app.database import get_session
from app.models.contact_message import ContactMessage
from app.models.user import User
from app.schemas.contact import ContactMessageResponse
from app.schemas.product import PaginatedResponse

router = APIRouter()


@router.get("/contacts", response_model=PaginatedResponse[ContactMessageResponse])
async def list_contacts(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: str | None = None,
    category: str | None = None,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[ContactMessageResponse]:
    query = select(ContactMessage)
    count_query = select(func.count()).select_from(ContactMessage)

    if search:
        like = f"%{search}%"
        query = query.where(
            ContactMessage.name.ilike(like) | ContactMessage.email.ilike(like)
        )
        count_query = count_query.where(
            ContactMessage.name.ilike(like) | ContactMessage.email.ilike(like)
        )
    if category:
        query = query.where(ContactMessage.category == category)
        count_query = count_query.where(ContactMessage.category == category)

    total = (await session.execute(count_query)).scalar_one()
    offset = (page - 1) * page_size
    result = await session.execute(
        query.order_by(ContactMessage.created_at.desc()).offset(offset).limit(page_size)
    )
    messages = result.scalars().all()

    return PaginatedResponse(
        items=[ContactMessageResponse.from_model(m) for m in messages],
        total=total,
        page=page,
        pageSize=page_size,
    )


@router.get("/contacts/{contact_id}", response_model=ContactMessageResponse)
async def get_contact(
    contact_id: int,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> ContactMessageResponse:
    result = await session.execute(
        select(ContactMessage).where(ContactMessage.id == contact_id)
    )
    message = result.scalars().first()
    if not message:
        raise HTTPException(status_code=404, detail="Contact message not found")
    return ContactMessageResponse.from_model(message)
