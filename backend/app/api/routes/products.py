from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_locale
from app.database import get_session
from app.models import AffiliateDisclosure, Product, ProductCategory, Shop
from app.models.product_bike_type import ProductBikeType
from app.services.translation import get_translations
from app.schemas.product import (
    AffiliateDisclosureResponse,
    BikeTypeResponse,
    CategoryDetailResponse,
    ProductCategoryResponse,
    ProductResponse,
    ShopResponse,
    TempRangeResponse,
    WeatherSuitabilityResponse,
    ZoneCategoryDetailResponse,
    ZoneCategoryResponse,
    ZoneResponse,
)

router = APIRouter(prefix="/products", tags=["products"])

# Canonical bike types
BIKE_TYPES = ["rennrad", "gravel", "mtb", "city"]

BIKE_TYPE_NAMES = {
    "de": {"rennrad": "Rennrad", "gravel": "Gravel", "mtb": "MTB", "city": "City"},
    "en": {"rennrad": "Road Bike", "gravel": "Gravel", "mtb": "MTB", "city": "City"},
}

# Zone ordering: top-to-bottom body order + equipment last
ZONE_ORDER = [
    "head",
    "eyes",
    "neck",
    "upperBody",
    "lowerBody",
    "hands",
    "feet",
    "equipment",
]

ZONE_NAMES = {
    "de": {
        "head": "Kopf",
        "eyes": "Augen",
        "neck": "Hals & Gesicht",
        "upperBody": "Oberkörper",
        "lowerBody": "Unterkörper",
        "hands": "Hände",
        "feet": "Füße",
        "equipment": "Ausrüstung",
    },
    "en": {
        "head": "Head",
        "eyes": "Eyes",
        "neck": "Neck & Face",
        "upperBody": "Upper Body",
        "lowerBody": "Lower Body",
        "hands": "Hands",
        "feet": "Feet",
        "equipment": "Equipment",
    },
}

# Category → zone mapping (reused from admin routes)
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


def _product_to_response(
    p: Product, bike_types: list[str] | None = None
) -> ProductResponse:
    temp_range = None
    if p.weather_temp_min is not None and p.weather_temp_max is not None:
        temp_range = TempRangeResponse(min=p.weather_temp_min, max=p.weather_temp_max)
    return ProductResponse(
        id=p.id,
        name=p.name,
        categoryId=p.category_id,
        imageUrl=p.image_url,
        shopId=p.shop_id,
        affiliateUrl=p.affiliate_url,
        matchesZone=p.matches_zone,
        matchesItemId=p.matches_item_id,
        matchesLabel=p.matches_label,
        bikeTypes=bike_types if bike_types is not None else [],
        weather=WeatherSuitabilityResponse(
            tempRange=temp_range,
            precipitation=p.weather_precipitation,
            wind=p.weather_wind,
            summary=p.weather_summary,
        ),
    )


@router.get("", response_model=list[ProductCategoryResponse])
async def list_categories(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> list[ProductCategoryResponse]:
    locale = get_locale(request)
    stmt = (
        select(
            ProductCategory.id,
            ProductCategory.name,
            ProductCategory.icon,
            func.count(Product.id).label("product_count"),
        )
        .outerjoin(
            Product,
            (Product.category_id == ProductCategory.id)
            & (Product.is_published == True),  # noqa: E712
        )
        .group_by(ProductCategory.id)
        .order_by(ProductCategory.display_order)
    )
    result = await session.execute(stmt)
    rows = result.all()
    cat_ids = [row.id for row in rows]
    trans = await get_translations(
        session, "product_category", cat_ids, locale, ["name"]
    )
    return [
        ProductCategoryResponse(
            id=row.id,
            name=trans.get(row.id, {}).get("name", row.name),
            icon=row.icon,
            productCount=row.product_count,
        )
        for row in rows
    ]


# --- Helper: load bike types for a batch of products ---


async def _load_product_bike_types(
    session: AsyncSession, product_ids: list[str]
) -> dict[str, list[str]]:
    """Return {product_id: [bike_type, ...]} for the given product IDs."""
    if not product_ids:
        return {}
    result = await session.execute(
        select(ProductBikeType).where(ProductBikeType.product_id.in_(product_ids))
    )
    rows = result.scalars().all()
    mapping: dict[str, list[str]] = {}
    for row in rows:
        mapping.setdefault(row.product_id, []).append(row.bike_type)
    return mapping


# --- Hierarchical navigation endpoints (must be before /{category_id} catch-all) ---


@router.get("/bike-types", response_model=list[BikeTypeResponse])
async def list_bike_types(
    request: Request,
) -> list[BikeTypeResponse]:
    locale = get_locale(request)
    names = BIKE_TYPE_NAMES.get(locale, BIKE_TYPE_NAMES["de"])
    return [BikeTypeResponse(id=bt, name=names[bt]) for bt in BIKE_TYPES]


@router.get("/browse/{bike_type}/zones", response_model=list[ZoneResponse])
async def list_zones_for_bike_type(
    bike_type: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> list[ZoneResponse]:
    if bike_type not in BIKE_TYPES:
        raise HTTPException(status_code=404, detail="Unknown bike type")

    locale = get_locale(request)
    zone_names = ZONE_NAMES.get(locale, ZONE_NAMES["de"])

    # Find all product IDs for this bike type
    bike_product_ids_result = await session.execute(
        select(ProductBikeType.product_id).where(ProductBikeType.bike_type == bike_type)
    )
    bike_product_ids = set(bike_product_ids_result.scalars().all())

    # Load all categories
    cat_result = await session.execute(
        select(ProductCategory).order_by(ProductCategory.display_order)
    )
    categories = cat_result.scalars().all()
    cat_ids = [c.id for c in categories]

    cat_trans = await get_translations(
        session, "product_category", cat_ids, locale, ["name"]
    )

    # Count published products per category that match this bike type
    count_stmt = (
        select(
            Product.category_id,
            func.count(Product.id).label("cnt"),
        ).where(Product.is_published == True)  # noqa: E712
    )
    if bike_product_ids:
        count_stmt = count_stmt.where(Product.id.in_(bike_product_ids))
    else:
        # No products for this bike type — all counts will be 0
        count_stmt = count_stmt.where(False)
    count_stmt = count_stmt.group_by(Product.category_id)

    count_result = await session.execute(count_stmt)
    cat_counts: dict[str, int] = {row[0]: row[1] for row in count_result.all()}

    # Build zone → categories mapping
    zone_categories: dict[str, list[ZoneCategoryResponse]] = {z: [] for z in ZONE_ORDER}
    for cat in categories:
        zone = CATEGORY_ZONE.get(cat.id, "equipment")
        cat_name = cat_trans.get(cat.id, {}).get("name", cat.name)
        count = cat_counts.get(cat.id, 0)
        zone_categories[zone].append(
            ZoneCategoryResponse(
                id=cat.id,
                name=cat_name,
                icon=cat.icon,
                productCount=count,
            )
        )

    return [
        ZoneResponse(
            id=zone_id,
            name=zone_names.get(zone_id, zone_id),
            productCount=sum(c.productCount for c in zone_categories[zone_id]),
            categories=zone_categories[zone_id],
        )
        for zone_id in ZONE_ORDER
    ]


@router.get(
    "/browse/{bike_type}/{zone}/{category_id}",
    response_model=ZoneCategoryDetailResponse,
)
async def get_zone_category_products(
    bike_type: str,
    zone: str,
    category_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> ZoneCategoryDetailResponse:
    if bike_type not in BIKE_TYPES:
        raise HTTPException(status_code=404, detail="Unknown bike type")
    if zone not in ZONE_ORDER:
        raise HTTPException(status_code=404, detail="Unknown zone")

    locale = get_locale(request)

    category = await session.get(ProductCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    # Verify category belongs to the requested zone
    if CATEGORY_ZONE.get(category_id) != zone:
        raise HTTPException(status_code=404, detail="Category not in this zone")

    # Get product IDs for this bike type
    bike_product_ids_result = await session.execute(
        select(ProductBikeType.product_id).where(ProductBikeType.bike_type == bike_type)
    )
    bike_product_ids = set(bike_product_ids_result.scalars().all())

    # Get published products in this category that match the bike type
    products_stmt = select(Product).where(
        Product.category_id == category_id,
        Product.is_published == True,  # noqa: E712
    )
    if bike_product_ids:
        products_stmt = products_stmt.where(Product.id.in_(bike_product_ids))
    else:
        products_stmt = products_stmt.where(False)

    products_result = await session.execute(products_stmt)
    products = list(products_result.scalars().all())

    product_bike_types = await _load_product_bike_types(
        session, [p.id for p in products]
    )

    shop_ids = {p.shop_id for p in products}
    shops: list[Shop] = []
    if shop_ids:
        shops_result = await session.execute(select(Shop).where(Shop.id.in_(shop_ids)))
        shops = list(shops_result.scalars().all())

    disclosure_result = await session.execute(
        select(AffiliateDisclosure)
        .where(AffiliateDisclosure.is_active == True)
        .limit(1)  # noqa: E712
    )
    disclosure = disclosure_result.scalars().first()

    cat_trans = await get_translations(
        session, "product_category", [category.id], locale, ["name"]
    )
    prod_ids = [p.id for p in products]
    prod_trans = await get_translations(
        session, "product", prod_ids, locale, ["matches_label", "weather_summary"]
    )
    disc_trans = {}
    if disclosure:
        disc_trans_map = await get_translations(
            session,
            "affiliate_disclosure",
            ["default"],
            locale,
            ["badge_label", "disclaimer_text"],
        )
        disc_trans = disc_trans_map.get("default", {})

    def _translated_product(p: Product) -> ProductResponse:
        resp = _product_to_response(p, bike_types=product_bike_types.get(p.id, []))
        pt = prod_trans.get(p.id, {})
        if "matches_label" in pt:
            resp.matchesLabel = pt["matches_label"]
        if "weather_summary" in pt and resp.weather:
            resp.weather.summary = pt["weather_summary"]
        return resp

    return ZoneCategoryDetailResponse(
        category=ProductCategoryResponse(
            id=category.id,
            name=cat_trans.get(category.id, {}).get("name", category.name),
            icon=category.icon,
            productCount=len(products),
        ),
        products=[_translated_product(p) for p in products],
        shops=[
            ShopResponse(
                id=s.id, name=s.name, logoUrl=s.logo_url, affiliateTag=s.affiliate_tag
            )
            for s in shops
        ],
        disclosure=(
            AffiliateDisclosureResponse(
                badgeLabel=disc_trans.get("badge_label", disclosure.badge_label),
                disclaimerText=disc_trans.get(
                    "disclaimer_text", disclosure.disclaimer_text
                ),
            )
            if disclosure
            else None
        ),
    )


# --- Legacy endpoints (backward compat) ---


@router.get("/{category_id}", response_model=CategoryDetailResponse)
async def get_category_detail(
    category_id: str,
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> CategoryDetailResponse:
    locale = get_locale(request)
    category = await session.get(ProductCategory, category_id)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")

    products_result = await session.execute(
        select(Product).where(
            Product.category_id == category_id, Product.is_published == True
        )  # noqa: E712
    )
    products = products_result.scalars().all()

    # Load bike types for these products
    product_bike_types = await _load_product_bike_types(
        session, [p.id for p in products]
    )

    shop_ids = {p.shop_id for p in products}
    shops: list[Shop] = []
    if shop_ids:
        shops_result = await session.execute(select(Shop).where(Shop.id.in_(shop_ids)))
        shops = list(shops_result.scalars().all())

    disclosure_result = await session.execute(
        select(AffiliateDisclosure)
        .where(AffiliateDisclosure.is_active == True)
        .limit(1)  # noqa: E712
    )
    disclosure = disclosure_result.scalars().first()

    product_count = len(products)

    # Fetch translations for category, products, and disclosure
    cat_trans = await get_translations(
        session, "product_category", [category.id], locale, ["name"]
    )
    prod_ids = [p.id for p in products]
    prod_trans = await get_translations(
        session, "product", prod_ids, locale, ["matches_label", "weather_summary"]
    )
    disc_trans = {}
    if disclosure:
        disc_trans_map = await get_translations(
            session,
            "affiliate_disclosure",
            ["default"],
            locale,
            ["badge_label", "disclaimer_text"],
        )
        disc_trans = disc_trans_map.get("default", {})

    def _translated_product(p: Product) -> ProductResponse:
        resp = _product_to_response(p, bike_types=product_bike_types.get(p.id, []))
        pt = prod_trans.get(p.id, {})
        if "matches_label" in pt:
            resp.matchesLabel = pt["matches_label"]
        if "weather_summary" in pt and resp.weather:
            resp.weather.summary = pt["weather_summary"]
        return resp

    return CategoryDetailResponse(
        category=ProductCategoryResponse(
            id=category.id,
            name=cat_trans.get(category.id, {}).get("name", category.name),
            icon=category.icon,
            productCount=product_count,
        ),
        products=[_translated_product(p) for p in products],
        shops=[
            ShopResponse(
                id=s.id, name=s.name, logoUrl=s.logo_url, affiliateTag=s.affiliate_tag
            )
            for s in shops
        ],
        disclosure=(
            AffiliateDisclosureResponse(
                badgeLabel=disc_trans.get("badge_label", disclosure.badge_label),
                disclaimerText=disc_trans.get(
                    "disclaimer_text", disclosure.disclaimer_text
                ),
            )
            if disclosure
            else None
        ),
    )
