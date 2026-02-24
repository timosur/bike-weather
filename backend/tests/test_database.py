from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import SQLModel


async def test_db_session_connects(db_session: AsyncSession) -> None:
    result = await db_session.execute(text("SELECT 1"))
    assert result.scalar() == 1


async def test_tables_created(db_session: AsyncSession) -> None:
    expected_tables = {
        "users",
        "shops",
        "product_categories",
        "products",
        "affiliate_disclosures",
        "saved_routes",
        "contact_messages",
        "faq_items",
        "about_content",
    }
    actual_tables = set(SQLModel.metadata.tables.keys())
    assert expected_tables.issubset(actual_tables)
