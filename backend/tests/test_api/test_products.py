from datetime import datetime, timezone

import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product


@pytest.fixture
async def _products(seeded_session: AsyncSession) -> None:
    """Insert test products into the seeded database (which has shops + categories)."""
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    products = [
        Product(
            id="prod-001",
            name="Jacket A",
            category_id="cat-rain-jackets",
            image_url="/img/a.jpg",
            shop_id="shop-bike-components",
            affiliate_url="https://example.com/a",
            matches_zone="upperBody",
            matches_label="Jacket",
            weather_temp_min=-5,
            weather_temp_max=15,
            weather_precipitation="heavy-rain",
            weather_wind="strong-wind",
            weather_summary="-5–15 °C",
            is_published=True,
            created_at=now,
            updated_at=now,
        ),
        Product(
            id="prod-002",
            name="Jacket B",
            category_id="cat-wind-jackets",
            image_url="/img/b.jpg",
            shop_id="shop-bike-components",
            affiliate_url="https://example.com/b",
            matches_zone="upperBody",
            matches_label="Jacket",
            weather_temp_min=8,
            weather_temp_max=18,
            weather_precipitation="light-rain",
            weather_wind="light-wind",
            weather_summary="8–18 °C",
            is_published=True,
            created_at=now,
            updated_at=now,
        ),
        Product(
            id="prod-003",
            name="Glove A",
            category_id="cat-winter-gloves",
            image_url="/img/c.jpg",
            shop_id="shop-bike-components",
            affiliate_url="https://example.com/c",
            matches_zone="hands",
            matches_label="Gloves",
            weather_temp_min=-10,
            weather_temp_max=5,
            weather_precipitation="heavy-rain",
            weather_wind="strong-wind",
            weather_summary="-10–5 °C",
            is_published=True,
            created_at=now,
            updated_at=now,
        ),
    ]
    for p in products:
        seeded_session.add(p)
    await seeded_session.commit()


async def test_list_categories_returns_all(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/products")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 18


async def test_list_categories_response_shape(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/products")
    data = response.json()
    cat = data[0]
    assert "id" in cat
    assert "name" in cat
    assert "icon" in cat
    assert "productCount" in cat
    assert isinstance(cat["productCount"], int)


@pytest.mark.usefixtures("_products")
async def test_list_categories_has_correct_product_counts(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/products")
    data = response.json()
    counts = {c["id"]: c["productCount"] for c in data}
    assert counts["cat-rain-jackets"] == 1
    assert counts["cat-wind-jackets"] == 1
    assert counts["cat-winter-gloves"] == 1


@pytest.mark.usefixtures("_products")
async def test_get_category_detail_returns_products(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/products/cat-rain-jackets")
    assert response.status_code == 200
    data = response.json()
    assert "category" in data
    assert "products" in data
    assert "shops" in data
    assert "disclosure" in data
    assert len(data["products"]) == 1


async def test_get_category_detail_unknown_id_returns_404(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/products/cat-nonexistent")
    assert response.status_code == 404


@pytest.mark.usefixtures("_products")
async def test_get_category_detail_response_shape(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/products/cat-rain-jackets")
    data = response.json()
    product = data["products"][0]
    assert "id" in product
    assert "name" in product
    assert "categoryId" in product
    assert "imageUrl" in product
    assert "shopId" in product
    assert "affiliateUrl" in product
    assert "matchesZone" in product
    assert "matchesLabel" in product
    assert "weather" in product
    weather = product["weather"]
    assert "tempRange" in weather
    assert "precipitation" in weather
    assert "wind" in weather
    assert "summary" in weather


@pytest.mark.usefixtures("_products")
async def test_unpublished_products_not_in_list(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    product = await seeded_session.get(Product, "prod-001")
    assert product is not None
    product.is_published = False
    await seeded_session.commit()

    response = await async_client.get("/api/products/cat-rain-jackets")
    data = response.json()
    product_ids = [p["id"] for p in data["products"]]
    assert "prod-001" not in product_ids
    assert data["category"]["productCount"] == 0
