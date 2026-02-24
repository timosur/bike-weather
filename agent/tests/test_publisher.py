"""Tests for the product publisher."""

import json
from unittest.mock import AsyncMock, patch

import httpx
import pytest

from agent.extractor import ProductData
from agent.publisher import BulkResult, _build_bulk_payload, publish_products


def _make_product(**kwargs) -> ProductData:
    defaults = {
        "name": "Test Product",
        "description": "Test description",
        "price": 49.99,
        "currency": "EUR",
        "image_url": "https://example.com/img.jpg",
        "affiliate_url": "https://example.com/product/1",
    }
    defaults.update(kwargs)
    return ProductData(**defaults)


class TestBuildBulkPayload:
    def test_builds_correct_structure(self):
        products = [_make_product(name="Jacket A"), _make_product(name="Jacket B")]
        payload = _build_bulk_payload(products, "cat-jackets", "shop-amazon")

        assert len(payload) == 2
        item = payload[0]
        assert item["name"] == "Jacket A"
        assert item["categoryId"] == "cat-jackets"
        assert item["shopId"] == "shop-amazon"
        assert item["isPublished"] is False  # drafts by default
        assert item["id"].startswith("agent-")

    def test_empty_products(self):
        payload = _build_bulk_payload([], "cat-jackets", "shop-amazon")
        assert payload == []


class TestPublishProducts:
    @pytest.mark.asyncio
    async def test_publish_calls_bulk_endpoint(self):
        """Verify correct HTTP call to /api/admin/products/bulk."""
        products = [_make_product()]
        mock_response = httpx.Response(
            200,
            json={"created": 1, "updated": 0, "errors": []},
            request=httpx.Request("POST", "http://test/api/admin/products/bulk"),
        )

        with patch("agent.publisher.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            result = await publish_products(
                products,
                "cat-jackets",
                "shop-amazon",
                api_url="http://test/api/admin",
                token="test-token",
            )

            mock_client.post.assert_called_once()
            call_args = mock_client.post.call_args
            assert "products/bulk" in call_args[0][0]
            assert call_args[1]["headers"]["Authorization"] == "Bearer test-token"

            assert result.created == 1
            assert result.updated == 0

    @pytest.mark.asyncio
    async def test_publish_handles_api_error(self):
        """API 500 is logged, not raised."""
        products = [_make_product()]
        mock_response = httpx.Response(
            500,
            text="Internal Server Error",
            request=httpx.Request("POST", "http://test/api/admin/products/bulk"),
        )

        with patch("agent.publisher.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            # Should not raise
            result = await publish_products(
                products,
                "cat-jackets",
                "shop-amazon",
                api_url="http://test/api/admin",
                token="test-token",
            )

            assert len(result.errors) > 0
            assert "500" in result.errors[0]

    @pytest.mark.asyncio
    async def test_publish_returns_summary(self):
        """Created/updated/skipped counts are returned."""
        products = [
            _make_product(),
            _make_product(name="Product B", affiliate_url="https://example.com/2"),
        ]
        mock_response = httpx.Response(
            200,
            json={"created": 1, "updated": 1, "errors": []},
            request=httpx.Request("POST", "http://test/api/admin/products/bulk"),
        )

        with patch("agent.publisher.httpx.AsyncClient") as mock_client_cls:
            mock_client = AsyncMock()
            mock_client.post.return_value = mock_response
            mock_client.__aenter__ = AsyncMock(return_value=mock_client)
            mock_client.__aexit__ = AsyncMock(return_value=False)
            mock_client_cls.return_value = mock_client

            result = await publish_products(
                products,
                "cat-jackets",
                "shop-amazon",
                api_url="http://test/api/admin",
                token="test-token",
            )

            assert result.created == 1
            assert result.updated == 1
            assert result.errors == []

    @pytest.mark.asyncio
    async def test_publish_empty_list(self):
        """Publishing empty list returns immediately."""
        result = await publish_products([], "cat-jackets", "shop-amazon")
        assert result.created == 0
        assert result.updated == 0
