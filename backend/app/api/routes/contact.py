from fastapi import APIRouter, Depends, Request
from slowapi.util import get_remote_address
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import ContactMessage
from app.rate_limit import limiter
from app.schemas.contact import ContactFormSchema
from app.services.turnstile import verify_turnstile

router = APIRouter(prefix="/contact", tags=["contact"])


@router.post("", status_code=201)
@limiter.limit("5/minute")
async def submit_contact_form(
    payload: ContactFormSchema,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> dict[str, str]:
    await verify_turnstile(payload.captcha_token, get_remote_address(request))
    msg = ContactMessage(
        category=payload.category,
        name=payload.name,
        email=payload.email,
        message=payload.message,
    )
    session.add(msg)
    await session.commit()
    return {"detail": "Message received"}
