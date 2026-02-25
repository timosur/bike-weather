"""bike-components.de shop configuration."""

from urllib.parse import quote_plus

from agent.shops.base import ShopBase


class BikeComponentsShop(ShopBase):
    """bike-components.de search and affiliate configuration."""

    @property
    def shop_id(self) -> str:
        return "shop-bike-components"

    @property
    def name(self) -> str:
        return "bike-components.de"

    @property
    def affiliate_tag(self) -> str | None:
        # Placeholder – set this once the affiliate program provides a tag/ref
        return None

    def search_url(self, query: str) -> str:
        """Build a bike-components.de search URL."""
        encoded = quote_plus(query)
        return f"https://www.bike-components.de/en/s/?filterPriceDE=1-100&sort=review_score&keywords={encoded}"

    def inject_affiliate_tag(self, url: str) -> str:
        """Inject affiliate tag into a product URL.

        bike-components.de affiliate links typically use a ref or
        partner parameter. Override once the exact format is known.
        """
        tag = self.affiliate_tag
        if not tag or not url:
            return url
        separator = "&" if "?" in url else "?"
        return f"{url}{separator}ref={tag}"
