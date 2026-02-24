from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_locale
from app.database import get_session
from app.models import AboutContent
from app.schemas.about import AboutContentResponse
from app.services.translation import get_translations

router = APIRouter(prefix="/about", tags=["about"])


@router.get("", response_model=list[AboutContentResponse])
async def list_about(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> list[AboutContentResponse]:
    locale = get_locale(request)
    result = await session.execute(
        select(AboutContent)
        .where(AboutContent.is_published == True)  # noqa: E712
        .order_by(AboutContent.display_order)
    )
    sections = result.scalars().all()
    trans = await get_translations(
        session, "about_content", [s.section_key for s in sections], locale,
        ["title", "body"],
    )
    return [
        AboutContentResponse(
            section_key=s.section_key,
            title=trans.get(s.section_key, {}).get("title", s.title),
            body=trans.get(s.section_key, {}).get("body", s.body),
            image_url=s.image_url,
        )
        for s in sections
    ]


@router.get("/{section_key}", response_model=AboutContentResponse)
async def get_about_section(
    section_key: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> AboutContentResponse:
    locale = get_locale(request)
    result = await session.execute(
        select(AboutContent).where(
            AboutContent.section_key == section_key,
            AboutContent.is_published == True,  # noqa: E712
        )
    )
    section = result.scalars().first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    trans = await get_translations(
        session, "about_content", [section.section_key], locale,
        ["title", "body"],
    )
    t = trans.get(section.section_key, {})
    return AboutContentResponse(
        section_key=section.section_key,
        title=t.get("title", section.title),
        body=t.get("body", section.body),
        image_url=section.image_url,
    )
