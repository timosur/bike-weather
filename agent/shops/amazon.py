"""Amazon.de shop configuration."""

from urllib.parse import quote_plus

from agent.shops.base import ShopBase


class AmazonShop(ShopBase):
    """Amazon.de search and affiliate configuration."""

    @property
    def shop_id(self) -> str:
        return "shop-amazon"

    @property
    def name(self) -> str:
        return "Amazon.de"

    @property
    def affiliate_tag(self) -> str | None:
        return "bikeweather-21"

    def search_url(self, query: str) -> str:
        """Build an Amazon.de search URL scoped to cycling."""
        encoded = quote_plus(query)
        return f"https://www.amazon.de/s?k={encoded}&i=sports&tag={self.affiliate_tag}"

    def inject_affiliate_tag(self, url: str) -> str:
        """Inject Amazon affiliate tag into a product URL."""
        tag = self.affiliate_tag
        if not tag or not url:
            return url
        separator = "&" if "?" in url else "?"
        return f"{url}{separator}tag={tag}"
