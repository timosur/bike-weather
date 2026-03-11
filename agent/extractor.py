"""LLM-based product data extractor."""

import hashlib
import json
import logging
from typing import Any

from pydantic import BaseModel, field_validator

from agent.config import settings

logger = logging.getLogger(__name__)

EXTRACTION_PROMPT = """\
You are a product data extraction assistant. Given text from a cycling product \
listing page, extract structured product information.

Category: {category}
Shop: {shop}

Extract ALL products you can find from the following text. For each product return:
- name: Full product name
- description: Key features as a short description (1-2 sentences)
- image_url: Product image URL if available, otherwise empty string
- affiliate_url: Product page URL / link
- matches_label: A short product-type description (e.g. "Waterproof Cycling Jacket", "Thermal Cycling Tights", "Light Cycling Gloves"). Describe what kind of product it is.
- temp_min: Minimum temperature (°C) this product is suitable for (integer). Infer from product features (e.g. thermal/winter → low, lightweight/summer → higher). null if unknown.
- temp_max: Maximum temperature (°C) this product is suitable for (integer). Infer from product features. null if unknown.
- precipitation: Rain/weather protection level. One of: "none", "light-rain", "heavy-rain", "snow". Infer from waterproof/water-resistant features.
- wind: Wind protection level. One of: "none", "light-wind", "strong-wind". Infer from windproof/windbreaker features.
- weather_summary: A 1-sentence summary of what weather conditions this product is best for.

Return a JSON array of objects. Example:
[
  {{
    "name": "Gore Wear C5 Gore-Tex Shakedry Jacket",
    "description": "Ultralight waterproof cycling jacket with excellent breathability.",
    "image_url": "https://example.com/image.jpg",
    "affiliate_url": "https://example.com/product/123",
    "matches_label": "Waterproof Cycling Jacket",
    "temp_min": -5,
    "temp_max": 10,
    "precipitation": "heavy-rain",
    "wind": "strong-wind",
    "weather_summary": "Best for cold, rainy and windy winter rides."
  }}
]

IMPORTANT:
- Return ONLY the JSON array, no other text.
- If no products are found, return an empty array: []
- Do not invent products. Only extract what is present in the text.
- For weather fields, make reasonable inferences from product names, descriptions, and features (e.g. "Gore-Tex" → heavy-rain, "Windproof" → strong-wind, "Thermal" → low temp_min).

Text to extract from:
---
{text}
---
"""


class ProductData(BaseModel):
    """Structured product data extracted by the LLM."""

    name: str
    description: str = ""
    image_url: str = ""
    affiliate_url: str = ""
    matches_label: str = "Cycling Product"
    temp_min: float | None = None
    temp_max: float | None = None
    precipitation: str = "none"
    wind: str = "none"
    weather_summary: str = ""

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Product name must not be empty")
        return v.strip()


def _generate_product_id(affiliate_url: str, name: str) -> str:
    """Generate a deterministic product ID from the affiliate URL (or name as fallback).

    This ensures idempotency — running the agent twice for the same product
    yields the same ID, so the bulk API updates rather than duplicates.
    """
    key = affiliate_url if affiliate_url else name
    h = hashlib.sha256(key.encode()).hexdigest()[:12]
    return f"agent-{h}"


async def _call_openai(prompt: str) -> str:
    """Call the OpenAI-compatible API."""
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.llm_api_key)
    response = await client.chat.completions.create(
        model=settings.llm_model,
        messages=[{"role": "user", "content": prompt}],
        temperature=0.0,
    )
    return response.choices[0].message.content or ""


async def _call_anthropic(prompt: str) -> str:
    """Call the Anthropic API."""
    from anthropic import AsyncAnthropic

    client = AsyncAnthropic(api_key=settings.llm_api_key)
    response = await client.messages.create(
        model=settings.llm_model,
        max_tokens=4096,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.content[0].text


async def _call_llm(prompt: str) -> str:
    """Route the prompt to the configured LLM provider."""
    if settings.llm_provider == "anthropic":
        return await _call_anthropic(prompt)
    return await _call_openai(prompt)


def _parse_llm_response(raw: str) -> list[dict[str, Any]]:
    """Parse JSON from an LLM response, handling markdown code fences."""
    text = raw.strip()
    # Strip markdown code fences if present
    if text.startswith("```"):
        lines = text.split("\n")
        # Remove first and last fence lines
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)
    return json.loads(text)


async def extract_products(
    text: str,
    category: str,
    shop: str,
) -> list[ProductData]:
    """Use an LLM to extract structured product data from page text.

    Returns a list of validated ProductData objects. Products with missing
    required fields are logged and skipped.
    """
    prompt = EXTRACTION_PROMPT.format(category=category, shop=shop, text=text[:15000])

    raw = await _call_llm(prompt)
    logger.debug("LLM raw response: %s", raw[:500])

    try:
        items = _parse_llm_response(raw)
    except (json.JSONDecodeError, ValueError):
        logger.warning("LLM returned unparseable JSON, retrying with correction prompt")
        correction = (
            "Your previous response was not valid JSON. "
            "Please return ONLY a JSON array of product objects. "
            f"Previous response:\n{raw[:2000]}"
        )
        raw2 = await _call_llm(correction)
        try:
            items = _parse_llm_response(raw2)
        except (json.JSONDecodeError, ValueError):
            logger.error("LLM retry also failed. Skipping batch.")
            return []

    if not isinstance(items, list):
        logger.error("LLM response is not a list, got %s", type(items))
        return []

    products: list[ProductData] = []
    for item in items:
        try:
            product = ProductData.model_validate(item)
            products.append(product)
        except Exception as e:
            logger.warning(
                "Skipping invalid product: %s — %s", item.get("name", "?"), e
            )

    logger.info("Extracted %d valid products from LLM response", len(products))
    return products
