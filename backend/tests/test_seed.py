from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import (
    AboutContent,
    AffiliateDisclosure,
    FaqItem,
    Product,
    ProductCategory,
    Shop,
)
from app.seed import run_seed


async def test_seed_shops(seeded_session: AsyncSession) -> None:
    result = await seeded_session.execute(select(func.count()).select_from(Shop))
    assert result.scalar() == 2


async def test_seed_categories(seeded_session: AsyncSession) -> None:
    result = await seeded_session.execute(select(func.count()).select_from(ProductCategory))
    assert result.scalar() == 7


async def test_seed_products(seeded_session: AsyncSession) -> None:
    result = await seeded_session.execute(select(func.count()).select_from(Product))
    assert result.scalar() == 10


async def test_seed_disclosure(seeded_session: AsyncSession) -> None:
    result = await seeded_session.execute(select(func.count()).select_from(AffiliateDisclosure))
    assert result.scalar() == 1


async def test_seed_faq(seeded_session: AsyncSession) -> None:
    result = await seeded_session.execute(select(func.count()).select_from(FaqItem))
    assert result.scalar() == 10


async def test_seed_about(seeded_session: AsyncSession) -> None:
    result = await seeded_session.execute(select(func.count()).select_from(AboutContent))
    assert result.scalar() == 3


async def test_seed_is_idempotent(seeded_session: AsyncSession) -> None:
    # seeded_session already ran seed once; run it again
    await run_seed(seeded_session)

    counts = {}
    for model, name in [
        (Shop, "shops"),
        (ProductCategory, "categories"),
        (Product, "products"),
        (AffiliateDisclosure, "disclosures"),
        (FaqItem, "faq"),
        (AboutContent, "about"),
    ]:
        result = await seeded_session.execute(select(func.count()).select_from(model))
        counts[name] = result.scalar()

    assert counts == {
        "shops": 2,
        "categories": 7,
        "products": 10,
        "disclosures": 1,
        "faq": 10,
        "about": 3,
    }
