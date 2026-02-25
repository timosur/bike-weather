"""Tests for per-shop configurations."""

import pytest

from agent.shops import get_shop, list_shops
from agent.shops.bike_components import BikeComponentsShop


class TestShopRegistry:
    def test_list_shops(self):
        shops = list_shops()
        assert "bike-components" in shops

    def test_get_shop_bike_components(self):
        shop = get_shop("bike-components")
        assert isinstance(shop, BikeComponentsShop)

    def test_get_shop_case_insensitive(self):
        shop = get_shop("Bike-Components")
        assert isinstance(shop, BikeComponentsShop)

    def test_get_shop_unknown_raises(self):
        with pytest.raises(ValueError, match="Unknown shop"):
            get_shop("nonexistent")


class TestBikeComponentsShop:
    def setup_method(self):
        self.shop = BikeComponentsShop()

    def test_shop_id(self):
        assert self.shop.shop_id == "shop-bike-components"

    def test_name(self):
        assert self.shop.name == "bike-components.de"

    def test_affiliate_tag(self):
        # Currently None; update once affiliate tag is configured
        assert self.shop.affiliate_tag is None

    def test_search_url_format(self):
        """Generates correct bike-components.de search URL."""
        url = self.shop.search_url("cycling rain jacket")
        assert "bike-components.de" in url
        assert "keywords=" in url
        assert "cycling" in url

    def test_search_url_encodes_query(self):
        url = self.shop.search_url("tights & pants")
        assert "tights" in url
        assert "pants" in url

    def test_inject_affiliate_tag_no_op(self):
        """No affiliate tag configured, so URL should be unchanged."""
        url = "https://www.bike-components.de/en/Product/12345"
        assert self.shop.inject_affiliate_tag(url) == url

    def test_inject_affiliate_tag_empty_url(self):
        result = self.shop.inject_affiliate_tag("")
        assert result == ""
