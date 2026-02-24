from httpx import AsyncClient
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import ContactMessage


VALID_PAYLOAD = {
    "category": "feedback",
    "name": "Max Mustermann",
    "email": "max@example.com",
    "message": "Tolle App, weiter so!",
}


async def test_submit_contact_form(async_client: AsyncClient) -> None:
    response = await async_client.post("/api/contact", json=VALID_PAYLOAD)
    assert response.status_code == 201
    assert response.json() == {"detail": "Message received"}


async def test_submit_contact_form_stores_in_db(
    async_client: AsyncClient, db_session: AsyncSession
) -> None:
    await async_client.post("/api/contact", json=VALID_PAYLOAD)
    result = await db_session.execute(select(ContactMessage))
    msg = result.scalar_one()
    assert msg.category == "feedback"
    assert msg.name == "Max Mustermann"
    assert msg.email == "max@example.com"
    assert msg.message == "Tolle App, weiter so!"
    assert msg.created_at is not None


async def test_submit_contact_form_invalid_email_returns_422(
    async_client: AsyncClient,
) -> None:
    payload = {**VALID_PAYLOAD, "email": "not-an-email"}
    response = await async_client.post("/api/contact", json=payload)
    assert response.status_code == 422


async def test_submit_contact_form_missing_fields_returns_422(
    async_client: AsyncClient,
) -> None:
    for field in ("name", "email", "message"):
        payload = {k: v for k, v in VALID_PAYLOAD.items() if k != field}
        response = await async_client.post("/api/contact", json=payload)
        assert response.status_code == 422, f"Missing '{field}' should return 422"


async def test_submit_contact_form_invalid_category_returns_422(
    async_client: AsyncClient,
) -> None:
    payload = {**VALID_PAYLOAD, "category": "unknown"}
    response = await async_client.post("/api/contact", json=payload)
    assert response.status_code == 422


async def test_submit_contact_form_message_too_long_returns_422(
    async_client: AsyncClient,
) -> None:
    payload = {**VALID_PAYLOAD, "message": "x" * 5001}
    response = await async_client.post("/api/contact", json=payload)
    assert response.status_code == 422
