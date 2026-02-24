from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import FaqItem


async def test_list_faq_returns_published_items(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/faq")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10


async def test_list_faq_ordered_by_display_order(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/faq")
    data = response.json()
    # First item should be "was-ist-fahrrad-wetter" (display_order=0)
    assert data[0]["id"] == "was-ist-fahrrad-wetter"
    # Last item should be "offline" (display_order=9)
    assert data[-1]["id"] == "offline"


async def test_unpublished_faq_not_in_list(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    item = await seeded_session.get(FaqItem, "kostenlos")
    assert item is not None
    item.is_published = False
    await seeded_session.commit()

    response = await async_client.get("/api/faq")
    data = response.json()
    ids = [i["id"] for i in data]
    assert "kostenlos" not in ids
    assert len(data) == 9
