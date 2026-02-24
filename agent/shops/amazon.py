"""Amazon shop configuration."""

from urllib.parse import quote_plus

from agent.shops.base import ShopBase


class AmazonShop(ShopBase):
    """Amazon.de search and affiliate configuration."""

    @property
    def shop_id(self) -> str:
        return "shop-amazon"

    @property
    def name(self) -> str:
        return "Amazon"

    @property
    def affiliate_tag(self) -> str | None:
        return "bikeweather-21"

    def search_url(self, query: str) -> str:
        """Build an Amazon.de search URL for cycling products."""
        encoded = quote_plus(query)
        base = f"https://www.amazon.de/s?k={encoded}"
        if self.affiliate_tag:
            base += f"&tag={self.affiliate_tag}"
        return base

    def inject_affiliate_tag(self, url: str) -> str:
        """Inject Amazon affiliate tag into a product URL."""
        tag = self.affiliate_tag
        if not tag or not url:
            return url
        # Amazon uses ?tag= or &tag=
        if "tag=" in url:
            return url
        separator = "&" if "?" in url else "?"
        return f"{url}{separator}tag={tag}"


# CSS selectors useful for targeted extraction (reference for future enhancements)
LISTING_SELECTOR = "div.s-result-item[data-component-type='s-search-result']"
PRODUCT_PAGE_SELECTOR = "div#dp-container"
