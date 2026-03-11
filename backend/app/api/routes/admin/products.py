from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_admin
from app.database import get_session
from app.models.product import Product
from app.models.product_category import ProductCategory
from app.models.shop import Shop
from app.models.user import User
from app.schemas.product import (
    BulkProductItem,
    BulkProductResponse,
    CategoryAdminResponse,
    CategoryCreate,
    CategoryOverviewItem,
    CategoryUpdate,
    PaginatedResponse,
    ProductAdminResponse,
    ProductCreate,
    ProductUpdate,
    ShopAdminResponse,
    ShopCreate,
    ShopUpdate,
)

router = APIRouter()

OUTDATED_DAYS = 30

CATEGORY_ZONE: dict[str, str] = {
    "cat-rain-jackets": "upperBody",
    "cat-wind-jackets": "upperBody",
    "cat-thermal-jackets": "upperBody",
    "cat-jerseys": "upperBody",
    "cat-base-layers": "upperBody",
    "cat-vests": "upperBody",
    "cat-thermal-tights": "lowerBody",
    "cat-cycling-shorts": "lowerBody",
    "cat-rain-pants": "lowerBody",
    "cat-winter-gloves": "hands",
    "cat-summer-gloves": "hands",
    "cat-headwear": "head",
    "cat-shoe-covers": "feet",
    "cat-cycling-shoes": "feet",
    "cat-eyewear": "eyes",
    "cat-neck-face": "neck",
    "cat-lights": "equipment",
    "cat-accessories": "equipment",
}


# --- Product Overview ---


@router.get("/products/overview", response_model=list[CategoryOverviewItem])
async def product_overview(
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> list[CategoryOverviewItem]:
    categories_result = await session.execute(
        select(ProductCategory).order_by(ProductCategory.display_order)
    )
    categories = categories_result.scalars().all()

    cutoff = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(
        days=OUTDATED_DAYS
    )
    items: list[CategoryOverviewItem] = []

    for cat in categories:
        stats = await session.execute(
            select(
                func.count(Product.id),
                func.count(Product.id).filter(Product.is_published.is_(True)),
                func.max(Product.updated_at),
                func.min(Product.updated_at),
            ).where(Product.category_id == cat.id)
        )
        row = stats.one()
        total, published, newest, oldest = row[0], row[1], row[2], row[3]

        if total == 0:
            status_val = "empty"
        elif newest and newest < cutoff:
            status_val = "outdated"
        else:
            status_val = "ok"

        items.append(
            CategoryOverviewItem(
                categoryId=cat.id,
                categoryName=cat.name,
                icon=cat.icon,
                zone=CATEGORY_ZONE.get(cat.id, "other"),
                totalProducts=total,
                publishedProducts=published,
                unpublishedProducts=total - published,
                newestProductAt=newest,
                oldestProductAt=oldest,
                status=status_val,
            )
        )

    return items


# --- Products ---


@router.get("/products", response_model=PaginatedResponse[ProductAdminResponse])
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=100),
    search: str | None = None,
    category_id: str | None = None,
    shop_id: str | None = None,
    is_published: bool | None = None,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> PaginatedResponse[ProductAdminResponse]:
    query = select(Product)
    count_query = select(func.count()).select_from(Product)

    if search:
        query = query.where(Product.name.ilike(f"%{search}%"))
        count_query = count_query.where(Product.name.ilike(f"%{search}%"))
    if category_id:
        query = query.where(Product.category_id == category_id)
        count_query = count_query.where(Product.category_id == category_id)
    if shop_id:
        query = query.where(Product.shop_id == shop_id)
        count_query = count_query.where(Product.shop_id == shop_id)
    if is_published is not None:
        query = query.where(Product.is_published == is_published)
        count_query = count_query.where(Product.is_published == is_published)

    total = (await session.execute(count_query)).scalar_one()
    offset = (page - 1) * page_size
    result = await session.execute(
        query.order_by(Product.updated_at.desc()).offset(offset).limit(page_size)
    )
    products = result.scalars().all()

    return PaginatedResponse(
        items=[ProductAdminResponse.from_model(p) for p in products],
        total=total,
        page=page,
        pageSize=page_size,
    )


@router.get("/products/{product_id}", response_model=ProductAdminResponse)
async def get_product(
    product_id: str,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> ProductAdminResponse:
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return ProductAdminResponse.from_model(product)


@router.post(
    "/products",
    response_model=ProductAdminResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_product(
    data: ProductCreate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> ProductAdminResponse:
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    product = Product(
        id=data.id,
        name=data.name,
        category_id=data.categoryId,
        image_url=data.imageUrl,
        shop_id=data.shopId,
        affiliate_url=data.affiliateUrl,
        matches_zone=data.matchesZone,
        matches_label=data.matchesLabel,
        weather_temp_min=data.weatherTempMin,
        weather_temp_max=data.weatherTempMax,
        weather_precipitation=data.weatherPrecipitation,
        weather_wind=data.weatherWind,
        weather_summary=data.weatherSummary,
        is_published=data.isPublished,
        created_at=now,
        updated_at=now,
    )
    session.add(product)
    await session.commit()
    await session.refresh(product)
    return ProductAdminResponse.from_model(product)


@router.put("/products/{product_id}", response_model=ProductAdminResponse)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> ProductAdminResponse:
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = data.model_dump(exclude_unset=True)
    field_map = {
        "categoryId": "category_id",
        "imageUrl": "image_url",
        "shopId": "shop_id",
        "affiliateUrl": "affiliate_url",
        "matchesZone": "matches_zone",
        "matchesLabel": "matches_label",
        "weatherTempMin": "weather_temp_min",
        "weatherTempMax": "weather_temp_max",
        "weatherPrecipitation": "weather_precipitation",
        "weatherWind": "weather_wind",
        "weatherSummary": "weather_summary",
        "isPublished": "is_published",
    }
    for camel, snake in field_map.items():
        if camel in update_data:
            update_data[snake] = update_data.pop(camel)

    for key, value in update_data.items():
        setattr(product, key, value)
    product.updated_at = datetime.now(timezone.utc).replace(tzinfo=None)
    await session.commit()
    await session.refresh(product)
    return ProductAdminResponse.from_model(product)


@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_product(
    product_id: str,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> None:
    result = await session.execute(select(Product).where(Product.id == product_id))
    product = result.scalars().first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    await session.delete(product)
    await session.commit()


@router.post("/products/bulk", response_model=BulkProductResponse)
async def bulk_import_products(
    items: list[BulkProductItem],
    replace_category: str | None = Query(
        None,
        alias="replaceCategory",
        description="If set, delete all existing products in this category before importing",
    ),
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> BulkProductResponse:
    created = 0
    updated = 0
    deleted = 0
    errors: list[str] = []
    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # If replaceCategory is set, delete all existing products in that category first
    if replace_category:
        existing_in_cat = await session.execute(
            select(Product).where(Product.category_id == replace_category)
        )
        for old_product in existing_in_cat.scalars().all():
            await session.delete(old_product)
            deleted += 1

    for item in items:
        try:
            result = await session.execute(select(Product).where(Product.id == item.id))
            existing = result.scalars().first()
            if existing:
                existing.name = item.name
                existing.category_id = item.categoryId
                existing.image_url = item.imageUrl
                existing.shop_id = item.shopId
                existing.affiliate_url = item.affiliateUrl
                existing.matches_zone = item.matchesZone
                existing.matches_label = item.matchesLabel
                existing.weather_temp_min = item.weatherTempMin
                existing.weather_temp_max = item.weatherTempMax
                existing.weather_precipitation = item.weatherPrecipitation
                existing.weather_wind = item.weatherWind
                existing.weather_summary = item.weatherSummary
                existing.is_published = item.isPublished
                existing.updated_at = now
                updated += 1
            else:
                product = Product(
                    id=item.id,
                    name=item.name,
                    category_id=item.categoryId,
                    image_url=item.imageUrl,
                    shop_id=item.shopId,
                    affiliate_url=item.affiliateUrl,
                    matches_zone=item.matchesZone,
                    matches_label=item.matchesLabel,
                    weather_temp_min=item.weatherTempMin,
                    weather_temp_max=item.weatherTempMax,
                    weather_precipitation=item.weatherPrecipitation,
                    weather_wind=item.weatherWind,
                    weather_summary=item.weatherSummary,
                    is_published=item.isPublished,
                    created_at=now,
                    updated_at=now,
                )
                session.add(product)
                created += 1
        except Exception as e:
            errors.append(f"Error processing product {item.id}: {e!s}")

    await session.commit()
    return BulkProductResponse(
        created=created, updated=updated, deleted=deleted, errors=errors
    )


# --- Categories ---


@router.get("/categories", response_model=list[CategoryAdminResponse])
async def list_categories(
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> list[CategoryAdminResponse]:
    result = await session.execute(
        select(ProductCategory).order_by(ProductCategory.display_order)
    )
    categories = result.scalars().all()
    return [CategoryAdminResponse.from_model(c) for c in categories]


@router.post(
    "/categories",
    response_model=CategoryAdminResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_category(
    data: CategoryCreate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> CategoryAdminResponse:
    category = ProductCategory(
        id=data.id,
        name=data.name,
        slug=data.slug,
        description=data.description,
        icon=data.icon,
        display_order=data.displayOrder,
    )
    session.add(category)
    await session.commit()
    await session.refresh(category)
    return CategoryAdminResponse.from_model(category)


@router.put("/categories/{category_id}", response_model=CategoryAdminResponse)
async def update_category(
    category_id: str,
    data: CategoryUpdate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> CategoryAdminResponse:
    result = await session.execute(
        select(ProductCategory).where(ProductCategory.id == category_id)
    )
    category = result.scalars().first()
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    update_data = data.model_dump(exclude_unset=True)
    field_map = {"displayOrder": "display_order"}
    for camel, snake in field_map.items():
        if camel in update_data:
            update_data[snake] = update_data.pop(camel)
    for key, value in update_data.items():
        setattr(category, key, value)
    await session.commit()
    await session.refresh(category)
    return CategoryAdminResponse.from_model(category)


# --- Shops ---


@router.get("/shops", response_model=list[ShopAdminResponse])
async def list_shops(
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> list[ShopAdminResponse]:
    result = await session.execute(select(Shop).order_by(Shop.name))
    shops = result.scalars().all()
    return [ShopAdminResponse.from_model(s) for s in shops]


@router.post(
    "/shops", response_model=ShopAdminResponse, status_code=status.HTTP_201_CREATED
)
async def create_shop(
    data: ShopCreate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> ShopAdminResponse:
    shop = Shop(
        id=data.id,
        name=data.name,
        logo_url=data.logoUrl,
        affiliate_tag=data.affiliateTag,
    )
    session.add(shop)
    await session.commit()
    await session.refresh(shop)
    return ShopAdminResponse.from_model(shop)


@router.put("/shops/{shop_id}", response_model=ShopAdminResponse)
async def update_shop(
    shop_id: str,
    data: ShopUpdate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> ShopAdminResponse:
    result = await session.execute(select(Shop).where(Shop.id == shop_id))
    shop = result.scalars().first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")

    update_data = data.model_dump(exclude_unset=True)
    field_map = {"logoUrl": "logo_url", "affiliateTag": "affiliate_tag"}
    for camel, snake in field_map.items():
        if camel in update_data:
            update_data[snake] = update_data.pop(camel)
    for key, value in update_data.items():
        setattr(shop, key, value)
    await session.commit()
    await session.refresh(shop)
    return ShopAdminResponse.from_model(shop)
