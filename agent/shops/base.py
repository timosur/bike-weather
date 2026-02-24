"""Base class for shop configurations."""

from abc import ABC, abstractmethod


class ShopBase(ABC):
    """Base class for per-shop scraping configuration."""

    @property
    @abstractmethod
    def shop_id(self) -> str:
        """The shop ID matching the backend shops table (e.g. 'shop-amazon')."""
        ...

    @property
    @abstractmethod
    def name(self) -> str:
        """Human-readable shop name."""
        ...

    @property
    @abstractmethod
    def affiliate_tag(self) -> str | None:
        """Affiliate tag to inject into product URLs, if any."""
        ...

    @abstractmethod
    def search_url(self, query: str) -> str:
        """Build a search URL for the given query."""
        ...

    def inject_affiliate_tag(self, url: str) -> str:
        """Inject the affiliate tag into a product URL.

        Default implementation appends ?tag=<tag> or &tag=<tag>.
        Subclasses can override for shop-specific logic.
        """
        tag = self.affiliate_tag
        if not tag or not url:
            return url
        separator = "&" if "?" in url else "?"
        return f"{url}{separator}tag={tag}"
