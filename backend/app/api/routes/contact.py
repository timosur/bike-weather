from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import ContactMessage
from app.schemas.contact import ContactFormSchema

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", status_code=201)
async def submit_contact_form(
    payload: ContactFormSchema,
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    msg = ContactMessage(
        category=payload.category,
        name=payload.name,
        email=payload.email,
        message=payload.message,
    )
    session.add(msg)
    await session.commit()
    return {"detail": "Message received"}
