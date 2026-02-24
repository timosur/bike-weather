from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import AboutContent
from app.schemas.about import AboutContentResponse

router = APIRouter(prefix="/about", tags=["about"])


@router.get("", response_model=list[AboutContentResponse])
async def list_about(session: AsyncSession = Depends(get_session)) -> list[AboutContentResponse]:
    result = await session.execute(
        select(AboutContent)
        .where(AboutContent.is_published == True)  # noqa: E712
        .order_by(AboutContent.display_order)
    )
    sections = result.scalars().all()
    return [
        AboutContentResponse(
            section_key=s.section_key, title=s.title, body=s.body, image_url=s.image_url
        )
        for s in sections
    ]


@router.get("/{section_key}", response_model=AboutContentResponse)
async def get_about_section(
    section_key: str, session: AsyncSession = Depends(get_session)
) -> AboutContentResponse:
    result = await session.execute(
        select(AboutContent).where(
            AboutContent.section_key == section_key,
            AboutContent.is_published == True,  # noqa: E712
        )
    )
    section = result.scalars().first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    return AboutContentResponse(
        section_key=section.section_key, title=section.title, body=section.body, image_url=section.image_url
    )
