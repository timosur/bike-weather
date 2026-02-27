from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_locale
from app.database import get_session
from app.models import AppInfoContent
from app.schemas.app_info import AppInfoContentResponse
from app.services.translation import get_translations

router = APIRouter(prefix="/app-info", tags=["app-info"])


@router.get("", response_model=list[AppInfoContentResponse])
async def list_app_info(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> list[AppInfoContentResponse]:
    locale = get_locale(request)
    result = await session.execute(
        select(AppInfoContent)
        .where(AppInfoContent.is_published == True)  # noqa: E712
        .order_by(AppInfoContent.display_order)
    )
    sections = result.scalars().all()
    trans = await get_translations(
        session,
        "app_info_content",
        [s.section_key for s in sections],
        locale,
        ["title", "body"],
    )
    return [
        AppInfoContentResponse(
            section_key=s.section_key,
            title=trans.get(s.section_key, {}).get("title", s.title),
            body=trans.get(s.section_key, {}).get("body", s.body),
            image_url=s.image_url,
        )
        for s in sections
    ]


@router.get("/{section_key}", response_model=AppInfoContentResponse)
async def get_app_info_section(
    section_key: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> AppInfoContentResponse:
    locale = get_locale(request)
    result = await session.execute(
        select(AppInfoContent).where(
            AppInfoContent.section_key == section_key,
            AppInfoContent.is_published == True,  # noqa: E712
        )
    )
    section = result.scalars().first()
    if not section:
        raise HTTPException(status_code=404, detail="Section not found")
    trans = await get_translations(
        session,
        "app_info_content",
        [section.section_key],
        locale,
        ["title", "body"],
    )
    t = trans.get(section.section_key, {})
    return AppInfoContentResponse(
        section_key=section.section_key,
        title=t.get("title", section.title),
        body=t.get("body", section.body),
        image_url=section.image_url,
    )
