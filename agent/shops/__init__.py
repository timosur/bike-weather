"""Per-shop configuration base and registry."""

from dataclasses import dataclass

from agent.shops.amazon import AmazonShop
from agent.shops.bike24 import Bike24Shop


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
    SHOPS["bike24"] = Bike24Shop()


_register_shops()


def get_shop(name: str) -> "ShopBase":
    """Look up a shop by name (case-insensitive)."""
    key = name.lower().strip()
    if key not in SHOPS:
        available = ", ".join(SHOPS.keys())
        raise ValueError(f"Unknown shop '{name}'. Available shops: {available}")
    return SHOPS[key]


def list_shops() -> list[str]:
    """Return available shop names."""
    return list(SHOPS.keys())


# Re-export for type hints
from agent.shops.base import ShopBase  # noqa: E402, F401
