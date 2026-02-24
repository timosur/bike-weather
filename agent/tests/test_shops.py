"""Tests for per-shop configurations."""

import pytest

from agent.shops import get_shop, list_shops
from agent.shops.amazon import AmazonShop
from agent.shops.bike24 import Bike24Shop


class TestShopRegistry:
    def test_list_shops(self):
        shops = list_shops()
        assert "amazon" in shops
        assert "bike24" in shops

    def test_get_shop_amazon(self):
        shop = get_shop("amazon")
        assert isinstance(shop, AmazonShop)

    def test_get_shop_bike24(self):
        shop = get_shop("bike24")
        assert isinstance(shop, Bike24Shop)

    def test_get_shop_case_insensitive(self):
        shop = get_shop("Amazon")
        assert isinstance(shop, AmazonShop)

    def test_get_shop_unknown_raises(self):
        with pytest.raises(ValueError, match="Unknown shop"):
            get_shop("nonexistent")


class TestAmazonShop:
    def setup_method(self):
        self.shop = AmazonShop()

    def test_shop_id(self):
        assert self.shop.shop_id == "shop-amazon"

    def test_name(self):
        assert self.shop.name == "Amazon"

    def test_affiliate_tag(self):
        assert self.shop.affiliate_tag == "bikeweather-21"

    def test_search_url_format(self):
        """Generates correct Amazon search URL with affiliate tag."""
        url = self.shop.search_url("cycling rain jacket")
        assert "amazon.de" in url
        assert "cycling+rain+jacket" in url or "cycling%20rain%20jacket" in url
        assert "tag=bikeweather-21" in url

    def test_search_url_encodes_query(self):
        url = self.shop.search_url("tights & pants")
        assert "tights" in url
        assert "pants" in url

    def test_affiliate_tag_injection(self):
        """Affiliate tag is correctly appended to product URLs."""
        url = self.shop.inject_affiliate_tag("https://www.amazon.de/dp/B08XYZ123")
        assert "tag=bikeweather-21" in url

    def test_affiliate_tag_injection_with_existing_params(self):
        url = self.shop.inject_affiliate_tag(
            "https://www.amazon.de/dp/B08XYZ123?ref=sr_1"
        )
        assert "tag=bikeweather-21" in url
        assert "&tag=" in url  # should use & not ?

    def test_affiliate_tag_not_duplicated(self):
        url = "https://www.amazon.de/dp/B08XYZ123?tag=bikeweather-21"
        result = self.shop.inject_affiliate_tag(url)
        assert result.count("tag=") == 1

    def test_affiliate_tag_empty_url(self):
        result = self.shop.inject_affiliate_tag("")
        assert result == ""


class TestBike24Shop:
    def setup_method(self):
        self.shop = Bike24Shop()

    def test_shop_id(self):
        assert self.shop.shop_id == "shop-bike24"

    def test_name(self):
        assert self.shop.name == "Bike24"

    def test_no_affiliate_tag(self):
        assert self.shop.affiliate_tag is None

    def test_search_url_format(self):
        url = self.shop.search_url("cycling gloves")
        assert "bike24.de" in url
        assert "searchTerm=" in url

    def test_inject_affiliate_tag_no_op(self):
        """Bike24 has no affiliate tag, so URL should be unchanged."""
        url = "https://www.bike24.de/product/123"
        assert self.shop.inject_affiliate_tag(url) == url
