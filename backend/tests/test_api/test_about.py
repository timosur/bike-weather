from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AboutContent


async def test_list_about_returns_published_sections(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/about")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 3


async def test_get_about_section_by_key(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/about/idea")
    assert response.status_code == 200
    data = response.json()
    assert data["section_key"] == "idea"
    assert data["title"] == "The idea"
    assert len(data["body"]) > 0


async def test_get_about_section_unknown_key_returns_404(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/about/nonexistent")
    assert response.status_code == 404


async def test_unpublished_about_not_in_list(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    result = await seeded_session.execute(
        select(AboutContent).where(AboutContent.section_key == "passion")
    )
    section = result.scalars().first()
    assert section is not None
    section.is_published = False
    await seeded_session.commit()

    response = await async_client.get("/api/about")
    data = response.json()
    keys = [s["section_key"] for s in data]
    assert "passion" not in keys
    assert len(data) == 2
