"""Tests for the LLM-based product extractor."""

import json
from unittest.mock import AsyncMock, patch

import pytest

from agent.extractor import (
    ProductData,
    _generate_product_id,
    _parse_llm_response,
    extract_products,
    extract_product_with_category,
)


class TestProductData:
    """Tests for the ProductData model."""

    def test_valid_product(self):
        p = ProductData(
            name="Test Jacket",
            description="A warm cycling jacket",
            image_url="https://example.com/img.jpg",
            affiliate_url="https://example.com/product/1",
        )
        assert p.name == "Test Jacket"

    def test_name_required(self):
        with pytest.raises(Exception):
            ProductData(name="", description="test")

    def test_name_stripped(self):
        p = ProductData(name="  Padded name  ")
        assert p.name == "Padded name"

    def test_defaults(self):
        p = ProductData(name="Minimal")
        assert p.image_url == ""
        assert p.affiliate_url == ""


class TestGenerateProductId:
    def test_deterministic(self):
        id1 = _generate_product_id("https://example.com/p/1", "Product A")
        id2 = _generate_product_id("https://example.com/p/1", "Product A")
        assert id1 == id2

    def test_starts_with_agent_prefix(self):
        pid = _generate_product_id("https://example.com/p/1", "Product A")
        assert pid.startswith("agent-")

    def test_different_urls_different_ids(self):
        id1 = _generate_product_id("https://example.com/p/1", "Same Name")
        id2 = _generate_product_id("https://example.com/p/2", "Same Name")
        assert id1 != id2

    def test_falls_back_to_name(self):
        id1 = _generate_product_id("", "Product A")
        id2 = _generate_product_id("", "Product A")
        assert id1 == id2
        assert id1.startswith("agent-")


class TestParseLlmResponse:
    def test_parse_plain_json(self):
        raw = json.dumps([{"name": "Test", "price": 10.0}])
        result = _parse_llm_response(raw)
        assert len(result) == 1
        assert result[0]["name"] == "Test"

    def test_parse_json_with_code_fences(self):
        raw = '```json\n[{"name": "Test", "price": 10.0}]\n```'
        result = _parse_llm_response(raw)
        assert len(result) == 1
        assert result[0]["name"] == "Test"

    def test_parse_empty_array(self):
        result = _parse_llm_response("[]")
        assert result == []

    def test_parse_invalid_json_raises(self):
        with pytest.raises((json.JSONDecodeError, ValueError)):
            _parse_llm_response("not json at all")


SAMPLE_LLM_RESPONSE = json.dumps(
    [
        {
            "name": "Gore Wear C5 Shakedry Jacket",
            "description": "Ultralight waterproof jacket with breathability.",
            "image_url": "https://example.com/gore.jpg",
            "affiliate_url": "https://www.bike-components.de/en/Product/12345",
        },
        {
            "name": "Castelli Perfetto RoS 2 Jacket",
            "description": "Wind and water-resistant cycling jacket.",
            "image_url": "https://example.com/castelli.jpg",
            "affiliate_url": "https://www.bike-components.de/en/Product/67890",
        },
    ]
)


class TestExtractProducts:
    @pytest.mark.asyncio
    async def test_extract_products_from_sample_text(self):
        """Given a known product page text, LLM returns expected product structure."""
        with patch("agent.extractor._call_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = SAMPLE_LLM_RESPONSE

            products = await extract_products(
                "Some product listing text...",
                "rain-jackets",
                "bike-components.de",
            )

            assert len(products) == 2
            assert products[0].name == "Gore Wear C5 Shakedry Jacket"
            assert products[1].name == "Castelli Perfetto RoS 2 Jacket"
            mock_llm.assert_called_once()

    @pytest.mark.asyncio
    async def test_extract_handles_malformed_llm_response(self):
        """Gracefully handles non-JSON LLM output by retrying once."""
        with patch("agent.extractor._call_llm", new_callable=AsyncMock) as mock_llm:
            # First call returns garbage, retry also fails
            mock_llm.side_effect = [
                "This is not JSON at all, sorry!",
                "Still not JSON...",
            ]

            products = await extract_products("text", "jackets", "bike-components.de")
            assert products == []
            assert mock_llm.call_count == 2

    @pytest.mark.asyncio
    async def test_extract_handles_malformed_then_succeeds(self):
        """Retry succeeds after first malformed response."""
        with patch("agent.extractor._call_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.side_effect = [
                "not json",
                SAMPLE_LLM_RESPONSE,
            ]

            products = await extract_products("text", "jackets", "bike-components.de")
            assert len(products) == 2
            assert mock_llm.call_count == 2

    @pytest.mark.asyncio
    async def test_extract_validates_required_fields(self):
        """Products missing name are flagged/skipped."""
        incomplete_response = json.dumps(
            [
                {"name": "Valid Product", "price": 10.0},
                {"name": "", "price": 20.0},  # empty name -> should be skipped
                {"price": 30.0},  # missing name entirely -> should be skipped
            ]
        )
        with patch("agent.extractor._call_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = incomplete_response

            products = await extract_products("text", "jackets", "bike-components.de")
            assert len(products) == 1
            assert products[0].name == "Valid Product"

    @pytest.mark.asyncio
    async def test_extract_handles_non_list_response(self):
        """LLM returns a dict instead of a list."""
        with patch("agent.extractor._call_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = json.dumps({"name": "Single product"})

            products = await extract_products("text", "jackets", "bike-components.de")
            assert products == []


SAMPLE_SINGLE_URL_LLM_RESPONSE = json.dumps(
    {
        "name": "Gore Wear C5 Gore-Tex Shakedry Jacket",
        "description": "Ultralight waterproof cycling jacket.",
        "image_url": "https://example.com/gore.jpg",
        "affiliate_url": "https://www.bike-components.de/en/Product/12345",
        "matches_label": "Waterproof Cycling Jacket",
        "temp_min": -5,
        "temp_max": 10,
        "precipitation": "heavy-rain",
        "wind": "strong-wind",
        "weather_summary": "Best for cold, rainy and windy winter rides.",
        "suggested_category_id": "cat-rain-jackets",
    }
)

SAMPLE_CATEGORIES = [
    {"id": "cat-rain-jackets", "name": "Rain Jackets"},
    {"id": "cat-jerseys", "name": "Jerseys"},
    {"id": "cat-cycling-shorts", "name": "Cycling Shorts"},
]


class TestExtractProductWithCategory:
    @pytest.mark.asyncio
    async def test_extract_product_with_category_suggestion(self):
        with patch("agent.extractor._call_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = SAMPLE_SINGLE_URL_LLM_RESPONSE

            product, category_id = await extract_product_with_category(
                "Some product page text...",
                "https://example.com/product/123",
                SAMPLE_CATEGORIES,
            )

            assert product is not None
            assert product.name == "Gore Wear C5 Gore-Tex Shakedry Jacket"
            assert product.precipitation == "heavy-rain"
            assert category_id == "cat-rain-jackets"
            mock_llm.assert_called_once()

    @pytest.mark.asyncio
    async def test_extract_returns_none_on_error(self):
        with patch("agent.extractor._call_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = json.dumps({"error": "no product found"})

            product, category_id = await extract_product_with_category(
                "Not a product page", "https://example.com/blog", SAMPLE_CATEGORIES
            )

            assert product is None
            assert category_id is None

    @pytest.mark.asyncio
    async def test_extract_unwraps_single_item_array(self):
        """LLM returns [product] instead of product — still works."""
        with patch("agent.extractor._call_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = json.dumps(
                [json.loads(SAMPLE_SINGLE_URL_LLM_RESPONSE)]
            )

            product, category_id = await extract_product_with_category(
                "text", "https://example.com/p/1", SAMPLE_CATEGORIES
            )

            assert product is not None
            assert product.name == "Gore Wear C5 Gore-Tex Shakedry Jacket"
            assert category_id == "cat-rain-jackets"

    @pytest.mark.asyncio
    async def test_extract_handles_null_category(self):
        response = json.loads(SAMPLE_SINGLE_URL_LLM_RESPONSE)
        response["suggested_category_id"] = None
        with patch("agent.extractor._call_llm", new_callable=AsyncMock) as mock_llm:
            mock_llm.return_value = json.dumps(response)

            product, category_id = await extract_product_with_category(
                "text", "https://example.com/p/1", SAMPLE_CATEGORIES
            )

            assert product is not None
            assert category_id is None
