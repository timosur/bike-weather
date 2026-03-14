"""Shop detection by URL domain."""

import re
from urllib.parse import urlparse

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.shop import Shop


def _extract_domain(url: str) -> str | None:
    """Extract the registrable domain from a URL (e.g. 'www.bike-components.de' → 'bike-components.de')."""
    try:
        parsed = urlparse(url)
        hostname = parsed.hostname
        if not hostname:
            return None
        # Strip 'www.' prefix
        if hostname.startswith("www."):
            hostname = hostname[4:]
        return hostname.lower()
    except Exception:
        return None


def _domain_to_shop_name(domain: str) -> str:
    """Generate a human-readable shop name from a domain.

    e.g. 'bike-discount.de' → 'Bike Discount'
    """
    # Take everything before the TLD
    name_part = domain.rsplit(".", 1)[0] if "." in domain else domain
    # Replace hyphens/underscores with spaces and title-case
    name = re.sub(r"[-_]", " ", name_part).strip().title()
    return name


def _domain_to_shop_id(domain: str) -> str:
    """Generate a shop ID from a domain.

    e.g. 'bike-discount.de' → 'shop-bike-discount'
    """
    name_part = domain.rsplit(".", 1)[0] if "." in domain else domain
    slug = re.sub(r"[^a-z0-9-]", "-", name_part.lower()).strip("-")
    return f"shop-{slug}"


async def detect_shop_by_url(url: str, session: AsyncSession) -> dict:
    """Detect which shop a URL belongs to.

    Returns a dict with:
      - id: shop ID (existing or suggested)
      - name: shop name (existing or suggested)
      - isNew: True if no matching shop found
      - hasAffiliateTag: True if the shop has an affiliate tag configured
      - baseUrl: the domain (for new shops)
    """
    domain = _extract_domain(url)
    if not domain:
        return {
            "id": None,
            "name": None,
            "isNew": True,
            "hasAffiliateTag": False,
            "baseUrl": None,
        }

    # Try matching by base_url
    result = await session.execute(select(Shop).where(Shop.base_url == domain))
    shop = result.scalars().first()

    if shop:
        return {
            "id": shop.id,
            "name": shop.name,
            "isNew": False,
            "hasAffiliateTag": bool(shop.affiliate_tag),
            "baseUrl": shop.base_url,
        }

    # No match — suggest a new shop
    return {
        "id": _domain_to_shop_id(domain),
        "name": _domain_to_shop_name(domain),
        "isNew": True,
        "hasAffiliateTag": False,
        "baseUrl": domain,
    }


async def check_duplicate_product(
    affiliate_url: str, session: AsyncSession
) -> dict | None:
    """Check if a product with the same affiliate URL already exists.

    Returns { id, name } if found, None otherwise.
    """
    from app.models.product import Product

    if not affiliate_url:
        return None

    result = await session.execute(
        select(Product).where(Product.affiliate_url == affiliate_url)
    )
    existing = result.scalars().first()
    if existing:
        return {"id": existing.id, "name": existing.name}
    return None
