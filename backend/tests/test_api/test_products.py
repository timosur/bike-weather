from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product
from app.seed import run_seed


async def test_list_categories_returns_all(async_client: AsyncClient, seeded_session: AsyncSession) -> None:
    response = await async_client.get("/api/products")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 7


async def test_list_categories_response_shape(async_client: AsyncClient, seeded_session: AsyncSession) -> None:
    response = await async_client.get("/api/products")
    data = response.json()
    cat = data[0]
    assert "id" in cat
    assert "name" in cat
    assert "icon" in cat
    assert "productCount" in cat
    assert isinstance(cat["productCount"], int)


async def test_list_categories_has_correct_product_counts(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/products")
    data = response.json()
    counts = {c["id"]: c["productCount"] for c in data}
    # From seed: jackets=2, gloves=2, pants=2, headwear=1, shoes=1, lights=1, accessories=1
    assert counts["cat-jackets"] == 2
    assert counts["cat-gloves"] == 2
    assert counts["cat-pants"] == 2
    assert counts["cat-headwear"] == 1
    assert counts["cat-shoes"] == 1
    assert counts["cat-lights"] == 1
    assert counts["cat-accessories"] == 1


async def test_get_category_detail_returns_products(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/products/cat-jackets")
    assert response.status_code == 200
    data = response.json()
    assert "category" in data
    assert "products" in data
    assert "shops" in data
    assert "disclosure" in data
    assert len(data["products"]) == 2


async def test_get_category_detail_unknown_id_returns_404(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/products/cat-nonexistent")
    assert response.status_code == 404


async def test_get_category_detail_response_shape(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    response = await async_client.get("/api/products/cat-jackets")
    data = response.json()
    product = data["products"][0]
    assert "id" in product
    assert "name" in product
    assert "price" in product
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


async def test_unpublished_products_not_in_list(
    async_client: AsyncClient, seeded_session: AsyncSession
) -> None:
    # Mark a product as unpublished
    product = await seeded_session.get(Product, "prod-001")
    assert product is not None
    product.is_published = False
    await seeded_session.commit()

    response = await async_client.get("/api/products/cat-jackets")
    data = response.json()
    product_ids = [p["id"] for p in data["products"]]
    assert "prod-001" not in product_ids
    assert data["category"]["productCount"] == 1
