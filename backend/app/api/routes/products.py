from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_session
from app.models import AffiliateDisclosure, Product, ProductCategory, Shop
from app.schemas.product import (
    AffiliateDisclosureResponse,
    CategoryDetailResponse,
    ProductCategoryResponse,
    ProductResponse,
    ShopResponse,
    TempRangeResponse,
    WeatherSuitabilityResponse,
)

router = APIRouter(prefix="/products", tags=["products"])


def _product_to_response(p: Product) -> ProductResponse:
    temp_range = None
    if p.weather_temp_min is not None and p.weather_temp_max is not None:
        temp_range = TempRangeResponse(min=p.weather_temp_min, max=p.weather_temp_max)
    return ProductResponse(
        id=p.id,
        name=p.name,
        categoryId=p.category_id,
        imageUrl=p.image_url,
        price=p.price,
        currency=p.currency,
        shopId=p.shop_id,
        affiliateUrl=p.affiliate_url,
        matchesZone=p.matches_zone,
        matchesLabel=p.matches_label,
        weather=WeatherSuitabilityResponse(
            tempRange=temp_range,
            precipitation=p.weather_precipitation,
            wind=p.weather_wind,
            summary=p.weather_summary,
        ),
    )


@router.get("", response_model=list[ProductCategoryResponse])
async def list_categories(session: AsyncSession = Depends(get_session)) -> list[ProductCategoryResponse]:
    stmt = (
        select(
            ProductCategory.id,
            ProductCategory.name,
            ProductCategory.icon,
            func.count(Product.id).label("product_count"),
        )
        .outerjoin(
            Product,
            (Product.category_id == ProductCategory.id) & (Product.is_published == True),  # noqa: E712
        )
        .group_by(ProductCategory.id)
        .order_by(ProductCategory.display_order)
    )
    result = await session.execute(stmt)
    return [
        ProductCategoryResponse(id=row.id, name=row.name, icon=row.icon, productCount=row.product_count)
        for row in result.all()
    ]


@router.get("/{category_id}", response_model=CategoryDetailResponse)
async def get_category_detail(
    category_id: str, session: AsyncSession = Depends(get_session)
) -> CategoryDetailResponse:
    category = await session.get(ProductCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    products_result = await session.execute(
        select(Product).where(Product.category_id == category_id, Product.is_published == True)  # noqa: E712
    )
    products = products_result.scalars().all()

    shop_ids = {p.shop_id for p in products}
    shops: list[Shop] = []
    if shop_ids:
        shops_result = await session.execute(select(Shop).where(Shop.id.in_(shop_ids)))
        shops = list(shops_result.scalars().all())

    disclosure_result = await session.execute(
        select(AffiliateDisclosure).where(AffiliateDisclosure.is_active == True).limit(1)  # noqa: E712
    )
    disclosure = disclosure_result.scalars().first()

    product_count = len(products)

    return CategoryDetailResponse(
        category=ProductCategoryResponse(
            id=category.id, name=category.name, icon=category.icon, productCount=product_count
        ),
        products=[_product_to_response(p) for p in products],
        shops=[
            ShopResponse(id=s.id, name=s.name, logoUrl=s.logo_url, affiliateTag=s.affiliate_tag) for s in shops
        ],
        disclosure=(
            AffiliateDisclosureResponse(badgeLabel=disclosure.badge_label, disclaimerText=disclosure.disclaimer_text)
            if disclosure
            else None
        ),
    )
