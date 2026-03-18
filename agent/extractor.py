"""LLM-based product data extractor."""

import hashlib
import json
import logging
from typing import Any

from pydantic import BaseModel, field_validator

from agent.config import settings

logger = logging.getLogger(__name__)


def _format_item_ids_for_prompt(item_ids: dict[str, str]) -> str:
    """Format the valid item IDs as a reference list for LLM prompts."""
    lines = []
    for item_id, name in item_ids.items():
        lines.append(f"- {item_id}: {name}")
    return "\n".join(lines)


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
- matches_item_id: The ID of the clothing/equipment item this product matches from the list below. Pick the single best match. Use null if unsure or no match.
- temp_min: Minimum temperature (°C) this product is suitable for (integer). Infer from product features (e.g. thermal/winter → low, lightweight/summer → higher). null if unknown.
- temp_max: Maximum temperature (°C) this product is suitable for (integer). Infer from product features. null if unknown.
- precipitation: Rain/weather protection level. One of: "none", "light-rain", "heavy-rain", "snow". Infer from waterproof/water-resistant features.
- wind: Wind protection level. One of: "none", "light-wind", "strong-wind". Infer from windproof/windbreaker features.
- weather_summary: A 1-sentence summary of what weather conditions this product is best for.

Valid clothing/equipment item IDs:
{item_ids}

Return a JSON array of objects. Example:
[
  {{
    "name": "Gore Wear C5 Gore-Tex Shakedry Jacket",
    "description": "Ultralight waterproof cycling jacket with excellent breathability.",
    "image_url": "https://example.com/image.jpg",
    "affiliate_url": "https://example.com/product/123",
    "matches_label": "Waterproof Cycling Jacket",
    "matches_item_id": "cl-rain-jacket",
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
- For matches_item_id, use ONLY IDs from the list above. Use the generic ID (e.g. "cl-rain-jacket") unless the product is clearly bike-type-specific (e.g. a road-specific jacket → "cl-rain-jacket-rennrad"). Use null if no item matches.

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
    matches_item_id: str | None = None

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
    item_ids: dict[str, str] | None = None,
) -> list[ProductData]:
    """Use an LLM to extract structured product data from page text.

    Returns a list of validated ProductData objects. Products with missing
    required fields are logged and skipped.
    """
    prompt = EXTRACTION_PROMPT.format(
        category=category,
        shop=shop,
        text=text[:15000],
        item_ids=_format_item_ids_for_prompt(item_ids or {}),
    )

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


SINGLE_URL_EXTRACTION_PROMPT = """\
You are a product data extraction assistant. Given text from a single product \
page, extract the product's structured information.

Product URL: {url}

Extract the product and return:
- name: Full product name
- description: Key features as a short description (1-2 sentences)
- image_url: Product image URL if available, otherwise empty string
- affiliate_url: Product page URL / link (use the URL above if not found in text)
- matches_label: A short product-type description (e.g. "Waterproof Cycling Jacket", "Thermal Cycling Tights"). Describe what kind of product it is.
- matches_item_id: The ID of the clothing/equipment item this product matches from the list below. Pick the single best match. Use null if unsure or no match.
- temp_min: Minimum temperature (°C) this product is suitable for (integer). Infer from product features. null if unknown.
- temp_max: Maximum temperature (°C) this product is suitable for (integer). Infer from product features. null if unknown.
- precipitation: Rain/weather protection level. One of: "none", "light-rain", "heavy-rain", "snow".
- wind: Wind protection level. One of: "none", "light-wind", "strong-wind".
- weather_summary: A 1-sentence summary of what weather conditions this product is best for.
- suggested_category_id: The ID of the best-matching category from the list below. null if none match.

Valid clothing/equipment item IDs:
{item_ids}

Available categories:
{categories}

Return a JSON object (NOT an array). Example:
{{
  "name": "Gore Wear C5 Gore-Tex Shakedry Jacket",
  "description": "Ultralight waterproof cycling jacket with excellent breathability.",
  "image_url": "https://example.com/image.jpg",
  "affiliate_url": "https://example.com/product/123",
  "matches_label": "Waterproof Cycling Jacket",
  "matches_item_id": "cl-rain-jacket",
  "temp_min": -5,
  "temp_max": 10,
  "precipitation": "heavy-rain",
  "wind": "strong-wind",
  "weather_summary": "Best for cold, rainy and windy winter rides.",
  "suggested_category_id": "cat-rain-jackets"
}}

IMPORTANT:
- Return ONLY the JSON object, no other text.
- If the page does not contain a product, return: {{"error": "no product found"}}
- Do not invent data. Only extract what is present in the text.
- For weather fields, make reasonable inferences from product features.
- For suggested_category_id, pick the single best-matching category from the list. Use null if unsure.
- For matches_item_id, use ONLY IDs from the valid item ID list above. Use the generic ID (e.g. "cl-rain-jacket") unless the product is clearly bike-type-specific. Use null if no item matches.

Text to extract from:
---
{text}
---
"""


async def extract_product_with_category(
    text: str,
    url: str,
    categories: list[dict[str, str]],
    item_ids: dict[str, str] | None = None,
) -> tuple["ProductData | None", str | None]:
    """Extract a single product from page text with category suggestion.

    Returns (ProductData, suggested_category_id) or (None, None) on failure.
    """
    cat_lines = "\n".join(f"- {c['id']}: {c['name']}" for c in categories)
    prompt = SINGLE_URL_EXTRACTION_PROMPT.format(
        url=url,
        categories=cat_lines,
        text=text[:15000],
        item_ids=_format_item_ids_for_prompt(item_ids or {}),
    )

    raw = await _call_llm(prompt)
    logger.debug("LLM single-URL raw response: %s", raw[:500])

    try:
        data = _parse_single_object(raw)
    except (json.JSONDecodeError, ValueError):
        logger.warning("LLM returned unparseable JSON for single URL, retrying")
        correction = (
            "Your previous response was not valid JSON. "
            "Please return ONLY a single JSON object with the product fields. "
            f"Previous response:\n{raw[:2000]}"
        )
        raw2 = await _call_llm(correction)
        try:
            data = _parse_single_object(raw2)
        except (json.JSONDecodeError, ValueError):
            logger.error("LLM retry also failed for single URL extraction.")
            return None, None

    if not isinstance(data, dict):
        logger.error("LLM response is not a dict, got %s", type(data))
        return None, None

    if "error" in data:
        logger.info("LLM reported no product: %s", data["error"])
        return None, None

    suggested_category_id = data.pop("suggested_category_id", None)

    try:
        product = ProductData.model_validate(data)
    except Exception as e:
        logger.warning("Invalid product data from single URL extraction: %s", e)
        return None, None

    logger.info(
        "Extracted product '%s' with suggested category '%s'",
        product.name,
        suggested_category_id,
    )
    return product, suggested_category_id


def _parse_single_object(raw: str) -> dict[str, Any]:
    """Parse a single JSON object from LLM response."""
    text = raw.strip()
    if text.startswith("```"):
        lines = text.split("\n")
        lines = [l for l in lines if not l.strip().startswith("```")]
        text = "\n".join(lines)
    result = json.loads(text)
    # If LLM returned an array with one item, unwrap it
    if isinstance(result, list) and len(result) == 1:
        return result[0]
    return result
