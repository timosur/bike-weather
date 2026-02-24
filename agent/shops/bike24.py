"""Bike24 shop configuration."""

from urllib.parse import quote_plus

from agent.shops.base import ShopBase


class Bike24Shop(ShopBase):
    """Bike24.de search and configuration."""

    @property
    def shop_id(self) -> str:
        return "shop-bike24"

    @property
    def name(self) -> str:
        return "Bike24"

    @property
    def affiliate_tag(self) -> str | None:
        return None  # No affiliate tag for Bike24

    def search_url(self, query: str) -> str:
        """Build a Bike24.de search URL."""
        encoded = quote_plus(query)
        return f"https://www.bike24.de/search?searchTerm={encoded}"


# CSS selectors for reference
LISTING_SELECTOR = "div.product-tile"
PRODUCT_PAGE_SELECTOR = "div.product-detail"
