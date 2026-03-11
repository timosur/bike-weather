"""Per-shop configuration base and registry."""

from dataclasses import dataclass

from agent.shops.amazon import AmazonShop
from agent.shops.bike_components import BikeComponentsShop


@dataclass
class ShopConfig:
    """Common shop configuration."""

    shop_id: str
    name: str
    affiliate_tag: str | None


# Registry of available shops
SHOPS: dict[str, "ShopBase"] = {}


def _register_shops() -> None:
    SHOPS["amazon"] = AmazonShop()
    SHOPS["bike-components"] = BikeComponentsShop()


_register_shops()


def get_shop(name: str) -> "ShopBase":
    """Look up a shop by name or shop_id (case-insensitive)."""
    key = name.lower().strip()
    if key in SHOPS:
        return SHOPS[key]
    # Also match by shop_id (e.g. "shop-bike-components" → "bike-components")
    for shop in SHOPS.values():
        if shop.shop_id.lower() == key:
            return shop
    available = ", ".join(SHOPS.keys())
    raise ValueError(f"Unknown shop '{name}'. Available shops: {available}")


def list_shops() -> list[str]:
    """Return available shop names."""
    return list(SHOPS.keys())


# Re-export for type hints
from agent.shops.base import ShopBase  # noqa: E402, F401
