"""Match published products to clothing/equipment items by body zone and weather fit."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AffiliateDisclosure, Product, Shop
from app.schemas.product import AffiliateDisclosureResponse, ShopResponse
from app.schemas.report import MatchedProductSchema, ProductRecommendationsSchema
from app.services.weather import WeatherForecast

logger = logging.getLogger(__name__)

# Clothing icon → product zone mapping.
ICON_TO_ZONE: dict[str, str] = {
    # Head
    "headband": "head",
    "helmet-cover": "head",
    # Eyes
    "sunglasses": "eyes",
    "glasses": "eyes",
    # Neck / Face
    "neck-gaiter": "neck",
    "face-mask": "neck",
    # Upper body
    "base-layer": "upperBody",
    "jersey": "upperBody",
    "jersey-long": "upperBody",
    "vest": "upperBody",
    "jacket": "upperBody",
    "rain-jacket": "upperBody",
    "arm-warmers": "upperBody",
    # Lower body
    "pants-short": "lowerBody",
    "pants-long": "lowerBody",
    "leg-warmers": "lowerBody",
    "overpants": "lowerBody",
    # Hands
    "gloves-light": "hands",
    "gloves-warm": "hands",
    "gloves-waterproof": "hands",
    # Feet
    "shoes": "feet",
    "shoe-covers": "feet",
    "socks": "feet",
}

# Equipment item ID prefix → product category mapping.
EQUIPMENT_TO_CATEGORY: dict[str, str] = {
    "eq-lights": "cat-lights",
    "eq-mudguards": "cat-accessories",
    "eq-dry-bag": "cat-accessories",
    "eq-sunscreen": "cat-accessories",
    "eq-repair-kit": "cat-accessories",
}

# Precipitation severity ordering for scoring.
_PRECIP_LEVELS = {"none": 0, "light-rain": 1, "heavy-rain": 2, "snow": 3}
# Wind severity ordering for scoring.
_WIND_LEVELS = {"none": 0, "light-wind": 1, "strong-wind": 2}


def _weather_score(product: Product, weather: WeatherForecast) -> float:
    """Score how well a product's weather suitability matches actual conditions.

    Higher is better. Returns 0.0–3.0.
    """
    score = 0.0

    # Temperature overlap (0–1 point)
    if product.weather_temp_min is not None and product.weather_temp_max is not None:
        feels = weather.temp_feels_like
        if product.weather_temp_min <= feels <= product.weather_temp_max:
            score += 1.0
        else:
            # Partial credit for being close (within 5°C)
            dist = max(
                product.weather_temp_min - feels, feels - product.weather_temp_max, 0
            )
            if dist <= 5:
                score += max(0, 1.0 - dist / 5.0)
    else:
        # No temp data — neutral half-point
        score += 0.5

    # Precipitation match (0–1 point)
    precip = weather.precipitation_probability
    if precip > 50:
        needed = 2  # heavy-rain
    elif precip > 20:
        needed = 1  # light-rain
    else:
        needed = 0  # none
    product_level = _PRECIP_LEVELS.get(product.weather_precipitation, 0)
    if product_level >= needed:
        score += 1.0
    elif product_level == needed - 1:
        score += 0.5

    # Wind match (0–1 point)
    wind = weather.wind_speed
    if wind > 30:
        needed_wind = 2  # strong-wind
    elif wind > 15:
        needed_wind = 1  # light-wind
    else:
        needed_wind = 0  # none
    product_wind = _WIND_LEVELS.get(product.weather_wind, 0)
    if product_wind >= needed_wind:
        score += 1.0
    elif product_wind == needed_wind - 1:
        score += 0.5

    return score


async def match_products_to_clothing(
    session: AsyncSession,
    clothing_items: list[dict],
    weather: WeatherForecast,
) -> ProductRecommendationsSchema | None:
    """Match the best product to each clothing item by zone + weather fit.

    Args:
        session: DB session.
        clothing_items: List of clothing item dicts with at least ``id`` and ``icon`` keys.
        weather: Current weather conditions for scoring.

    Returns:
        A ``ProductRecommendationsSchema`` with matched products keyed by clothing item ID,
        or ``None`` if no products are available.
    """
    # Fetch all published products
    result = await session.execute(
        select(Product).where(Product.is_published == True)  # noqa: E712
    )
    products = list(result.scalars().all())
    if not products:
        return None

    # Group products by zone
    zone_products: dict[str, list[Product]] = {}
    for p in products:
        if p.matches_zone:
            zone_products.setdefault(p.matches_zone, []).append(p)

    # Fetch shops for lookup
    shop_ids = {p.shop_id for p in products}
    shops_result = await session.execute(select(Shop).where(Shop.id.in_(shop_ids)))
    shop_map = {s.id: s for s in shops_result.scalars().all()}

    # Fetch active disclosure
    disc_result = await session.execute(
        select(AffiliateDisclosure).where(AffiliateDisclosure.is_active == True)  # noqa: E712
    )
    disc = disc_result.scalars().first()
    if not disc:
        return None

    # Match products to clothing items
    matched: dict[str, MatchedProductSchema] = {}
    used_shop_ids: set[str] = set()

    for item in clothing_items:
        icon = item.get("icon", "")
        zone = ICON_TO_ZONE.get(icon)
        if not zone:
            continue

        candidates = zone_products.get(zone, [])
        if not candidates:
            continue

        # Score and pick best
        best_product: Product | None = None
        best_score = -1.0
        for p in candidates:
            s = _weather_score(p, weather)
            if s > best_score:
                best_score = s
                best_product = p

        if best_product and best_product.shop_id in shop_map:
            matched[item["id"]] = MatchedProductSchema(
                id=best_product.id,
                name=best_product.name,
                imageUrl=best_product.image_url,
                shopId=best_product.shop_id,
                affiliateUrl=best_product.affiliate_url,
                matchesLabel=best_product.matches_label,
                weatherSummary=best_product.weather_summary,
            )
            used_shop_ids.add(best_product.shop_id)

    if not matched:
        return None

    # Build response with only referenced shops
    shops_response = [
        ShopResponse(
            id=s.id,
            name=s.name,
            logoUrl=s.logo_url,
            affiliateTag=s.affiliate_tag,
        )
        for sid in used_shop_ids
        if (s := shop_map.get(sid))
    ]

    disclosure_response = AffiliateDisclosureResponse(
        badgeLabel=disc.badge_label,
        disclaimerText=disc.disclaimer_text,
    )

    return ProductRecommendationsSchema(
        matched=matched,
        shops=shops_response,
        disclosure=disclosure_response,
    )


async def match_products_to_equipment(
    session: AsyncSession,
    equipment_items: list[dict],
    weather: WeatherForecast,
) -> dict[str, MatchedProductSchema] | None:
    """Match the best product to each equipment item by category + weather fit.

    Args:
        session: DB session.
        equipment_items: List of equipment item dicts with at least ``id`` key.
        weather: Current weather conditions for scoring.

    Returns:
        A dict of equipment item ID → MatchedProductSchema, or None if no matches.
    """
    # Fetch all published products in equipment categories
    equipment_cat_ids = list(set(EQUIPMENT_TO_CATEGORY.values()))
    result = await session.execute(
        select(Product).where(
            Product.is_published == True,  # noqa: E712
            Product.category_id.in_(equipment_cat_ids),
        )
    )
    products = list(result.scalars().all())
    if not products:
        return None

    # Group products by category
    cat_products: dict[str, list[Product]] = {}
    for p in products:
        cat_products.setdefault(p.category_id, []).append(p)

    # Fetch shops for lookup
    shop_ids = {p.shop_id for p in products}
    shops_result = await session.execute(select(Shop).where(Shop.id.in_(shop_ids)))
    shop_map = {s.id: s for s in shops_result.scalars().all()}

    matched: dict[str, MatchedProductSchema] = {}

    for item in equipment_items:
        item_id = item.get("id", "")
        # Find the matching category by prefix
        target_cat = None
        for prefix, cat_id in EQUIPMENT_TO_CATEGORY.items():
            if item_id.startswith(prefix):
                target_cat = cat_id
                break
        if not target_cat:
            continue

        candidates = cat_products.get(target_cat, [])
        if not candidates:
            continue

        # Score and pick best
        best_product: Product | None = None
        best_score = -1.0
        for p in candidates:
            s = _weather_score(p, weather)
            if s > best_score:
                best_score = s
                best_product = p

        if best_product and best_product.shop_id in shop_map:
            matched[item_id] = MatchedProductSchema(
                id=best_product.id,
                name=best_product.name,
                imageUrl=best_product.image_url,
                shopId=best_product.shop_id,
                affiliateUrl=best_product.affiliate_url,
                matchesLabel=best_product.matches_label,
                weatherSummary=best_product.weather_summary,
            )

    return matched if matched else None


async def _build_product_recs_scaffold(
    session: AsyncSession,
    matched: dict[str, MatchedProductSchema],
) -> ProductRecommendationsSchema | None:
    """Build a ProductRecommendationsSchema from an equipment-only matched dict."""
    shop_ids = {m.shopId for m in matched.values()}
    shops_result = await session.execute(select(Shop).where(Shop.id.in_(shop_ids)))
    shop_map = {s.id: s for s in shops_result.scalars().all()}

    disc_result = await session.execute(
        select(AffiliateDisclosure).where(AffiliateDisclosure.is_active == True)  # noqa: E712
    )
    disc = disc_result.scalars().first()
    if not disc:
        return None

    shops_response = [
        ShopResponse(
            id=s.id,
            name=s.name,
            logoUrl=s.logo_url,
            affiliateTag=s.affiliate_tag,
        )
        for sid in shop_ids
        if (s := shop_map.get(sid))
    ]

    return ProductRecommendationsSchema(
        matched=matched,
        shops=shops_response,
        disclosure=AffiliateDisclosureResponse(
            badgeLabel=disc.badge_label,
            disclaimerText=disc.disclaimer_text,
        ),
    )
