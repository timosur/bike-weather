"""Match published products to clothing/equipment items by item ID and weather fit."""

import logging

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AffiliateDisclosure, Product, Shop
from app.schemas.product import AffiliateDisclosureResponse, ShopResponse
from app.schemas.report import MatchedProductSchema, ProductRecommendationsSchema
from app.services.weather import WeatherForecast

logger = logging.getLogger(__name__)

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


def _pick_best(candidates: list[Product], weather: WeatherForecast) -> Product | None:
    """Pick the best weather-scored product from a list of candidates."""
    best_product: Product | None = None
    best_score = -1.0
    for p in candidates:
        s = _weather_score(p, weather)
        if s > best_score:
            best_score = s
            best_product = p
    return best_product


async def match_products_to_clothing(
    session: AsyncSession,
    clothing_items: list[dict],
    weather: WeatherForecast,
) -> ProductRecommendationsSchema | None:
    """Match the best product to each clothing item by ``matches_item_id`` + weather fit.

    Products are matched directly to clothing items via their ``matches_item_id`` field.
    When multiple products share the same item ID, weather scoring picks the best fit.
    Items with no matching product are skipped (no zone fallback).

    Args:
        session: DB session.
        clothing_items: List of clothing item dicts with at least ``id`` key.
        weather: Current weather conditions for scoring.

    Returns:
        A ``ProductRecommendationsSchema`` with matched products keyed by clothing item ID,
        or ``None`` if no products match.
    """
    # Fetch published products that have a matches_item_id assigned
    result = await session.execute(
        select(Product).where(
            Product.is_published == True,  # noqa: E712
            Product.matches_item_id.isnot(None),
        )
    )
    products = list(result.scalars().all())
    if not products:
        return None

    # Group products by matches_item_id
    item_products: dict[str, list[Product]] = {}
    for p in products:
        item_products.setdefault(p.matches_item_id, []).append(p)

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

    # Match products to clothing items by item ID
    matched: dict[str, MatchedProductSchema] = {}
    used_shop_ids: set[str] = set()

    for item in clothing_items:
        item_id = item.get("id", "")
        candidates = item_products.get(item_id, [])
        if not candidates:
            continue

        # Score and pick best
        best_product = _pick_best(candidates, weather)

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
    """Match the best product to each equipment item by ``matches_item_id`` + weather fit.

    Uses prefix matching: a product with ``matches_item_id="eq-lights"`` matches
    equipment items ``eq-lights-before-sunrise``, ``eq-lights-after-sunset``, etc.

    Args:
        session: DB session.
        equipment_items: List of equipment item dicts with at least ``id`` key.
        weather: Current weather conditions for scoring.

    Returns:
        A dict of equipment item ID → MatchedProductSchema, or None if no matches.
    """
    # Fetch published products with an eq-* matches_item_id
    result = await session.execute(
        select(Product).where(
            Product.is_published == True,  # noqa: E712
            Product.matches_item_id.isnot(None),
            Product.matches_item_id.startswith("eq-"),
        )
    )
    products = list(result.scalars().all())
    if not products:
        return None

    # Group products by matches_item_id
    item_products: dict[str, list[Product]] = {}
    for p in products:
        item_products.setdefault(p.matches_item_id, []).append(p)

    # Fetch shops for lookup
    shop_ids = {p.shop_id for p in products}
    shops_result = await session.execute(select(Shop).where(Shop.id.in_(shop_ids)))
    shop_map = {s.id: s for s in shops_result.scalars().all()}

    matched: dict[str, MatchedProductSchema] = {}

    for item in equipment_items:
        item_id = item.get("id", "")

        # Try exact match first, then prefix match (eq-lights matches eq-lights-*)
        candidates: list[Product] = []
        if item_id in item_products:
            candidates = item_products[item_id]
        else:
            # Prefix match: find products whose matches_item_id is a prefix of item_id
            for product_item_id, prods in item_products.items():
                if (
                    item_id.startswith(product_item_id + "-")
                    or item_id == product_item_id
                ):
                    candidates.extend(prods)

        if not candidates:
            continue

        best_product = _pick_best(candidates, weather)

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
