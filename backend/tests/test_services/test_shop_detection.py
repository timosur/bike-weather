"""Tests for shop detection service."""

from app.services.shop_detection import (
    _extract_domain,
    _domain_to_shop_name,
    _domain_to_shop_id,
)


class TestExtractDomain:
    def test_simple_url(self):
        assert (
            _extract_domain("https://www.bike-components.de/en/Product/123")
            == "bike-components.de"
        )

    def test_without_www(self):
        assert (
            _extract_domain("https://bike-components.de/en/Product/123")
            == "bike-components.de"
        )

    def test_amazon(self):
        assert _extract_domain("https://www.amazon.de/dp/B0123456") == "amazon.de"

    def test_subdomain(self):
        assert (
            _extract_domain("https://shop.example.com/product/1") == "shop.example.com"
        )

    def test_invalid_url(self):
        assert _extract_domain("not-a-url") is None

    def test_empty_string(self):
        assert _extract_domain("") is None


class TestDomainToShopName:
    def test_hyphenated(self):
        assert _domain_to_shop_name("bike-components.de") == "Bike Components"

    def test_simple(self):
        assert _domain_to_shop_name("amazon.de") == "Amazon"

    def test_multi_part(self):
        assert _domain_to_shop_name("bike-discount.de") == "Bike Discount"


class TestDomainToShopId:
    def test_hyphenated(self):
        assert _domain_to_shop_id("bike-components.de") == "shop-bike-components"

    def test_simple(self):
        assert _domain_to_shop_id("amazon.de") == "shop-amazon"
