"""Core extraction pipeline for the product agent."""

import asyncio
import logging
from collections.abc import Callable
from typing import Any

from agent.extractor import ProductData, extract_products, extract_product_with_category
from agent.scraper import extract_text, fetch_page
from agent.shops import get_shop

# Known category slug → category_id mapping (matches backend seed data)
CATEGORY_MAP: dict[str, str] = {
    # Rain jackets
    "rain-jackets": "cat-rain-jackets",
    "rain-gear": "cat-rain-jackets",
    # Wind jackets
    "wind-jackets": "cat-wind-jackets",
    "softshell-jackets": "cat-wind-jackets",
    # Thermal jackets
    "thermal-jackets": "cat-thermal-jackets",
    "winter-jackets": "cat-thermal-jackets",
    # Jerseys
    "jerseys": "cat-jerseys",
    "cycling-jerseys": "cat-jerseys",
    # Base layers
    "base-layers": "cat-base-layers",
    "baselayers": "cat-base-layers",
    "underwear": "cat-base-layers",
    # Vests
    "vests": "cat-vests",
    "cycling-vests": "cat-vests",
    # Thermal tights
    "thermal-tights": "cat-thermal-tights",
    "winter-tights": "cat-thermal-tights",
    # Cycling shorts
    "cycling-shorts": "cat-cycling-shorts",
    "bib-shorts": "cat-cycling-shorts",
    # Rain pants
    "rain-pants": "cat-rain-pants",
    "waterproof-pants": "cat-rain-pants",
    # Winter gloves
    "winter-gloves": "cat-winter-gloves",
    "thermal-gloves": "cat-winter-gloves",
    # Summer gloves
    "summer-gloves": "cat-summer-gloves",
    "cycling-gloves": "cat-summer-gloves",
    "gloves": "cat-summer-gloves",
    # Headwear
    "headwear": "cat-headwear",
    "hats-caps": "cat-headwear",
    "caps": "cat-headwear",
    # Shoe covers
    "shoe-covers": "cat-shoe-covers",
    "overshoes": "cat-shoe-covers",
    # Cycling shoes
    "cycling-shoes": "cat-cycling-shoes",
    "shoes": "cat-cycling-shoes",
    "cycling-shoes-overshoes": "cat-cycling-shoes",
    # Eyewear
    "eyewear": "cat-eyewear",
    "sunglasses": "cat-eyewear",
    "cycling-glasses": "cat-eyewear",
    # Neck & face
    "neck-face": "cat-neck-face",
    "neck-warmers": "cat-neck-face",
    "balaclavas": "cat-neck-face",
    # Lights
    "bike-lights": "cat-lights",
    "lights": "cat-lights",
    # Accessories
    "accessories-gear": "cat-accessories",
    "accessories": "cat-accessories",
    # --- Backward-compat aliases for old generic categories ---
    "cycling-jackets": "cat-rain-jackets",
    "jackets": "cat-rain-jackets",
    "cycling-tights": "cat-thermal-tights",
    "tights": "cat-thermal-tights",
    "pants": "cat-thermal-tights",
}

# Canonical list: one slug per unique backend category (used by --all)
ALL_CATEGORIES: list[str] = [
    "rain-jackets",
    "wind-jackets",
    "thermal-jackets",
    "jerseys",
    "base-layers",
    "vests",
    "thermal-tights",
    "cycling-shorts",
    "rain-pants",
    "winter-gloves",
    "summer-gloves",
    "headwear",
    "shoe-covers",
    "cycling-shoes",
    "eyewear",
    "neck-face",
    "bike-lights",
    "accessories-gear",
]

DEFAULT_MAX_PRODUCTS = 5

# Type for progress callbacks used by the server
ProgressCallback = Callable[[str, str, dict[str, Any] | None], None]


def _noop_progress(
    stage: str, message: str, data: dict[str, Any] | None = None
) -> None:
    """Default no-op progress callback."""


def _resolve_category_id(category: str) -> str:
    """Resolve a category name/slug to a backend category ID."""
    key = category.lower().strip()
    if key in CATEGORY_MAP:
        return CATEGORY_MAP[key]
    # If it already looks like a category ID, return as-is
    if key.startswith("cat-"):
        return key
    # Default: construct a slug-style ID
    return f"cat-{key}"


def _build_search_query(category: str) -> str:
    """Build a search query string from the category."""
    # Turn slug-style into natural language
    query = category.replace("-", " ")
    # Avoid "cycling cycling jackets" when slug already starts with "cycling"
    if not query.lower().startswith("cycling"):
        query = f"cycling {query}"
    return query


async def run_category(
    category: str,
    shop_name: str,
    *,
    max_products: int = DEFAULT_MAX_PRODUCTS,
    progress: ProgressCallback | None = None,
) -> list[ProductData]:
    """Run the scrape → extract pipeline for a single category.

    Returns a list of ProductData for the HTTP server review workflow.
    """
    on_progress = progress or _noop_progress

    shop = get_shop(shop_name)
    category_id = _resolve_category_id(category)
    search_query = _build_search_query(category)
    search_url = shop.search_url(search_query)

    on_progress(
        "init",
        f"Shop: {shop.name} | Category: {category} → {category_id}",
        {
            "shop": shop.name,
            "shopId": shop.shop_id,
            "category": category,
            "categoryId": category_id,
            "searchUrl": search_url,
        },
    )

    # 1. Fetch search results page
    on_progress("scraping", "Fetching search results…")
    try:
        html = await fetch_page(search_url)
    except Exception as e:
        on_progress("failed", f"Failed to fetch page: {e}")
        return []

    # 2. Extract text from HTML
    on_progress("scraping", "Extracting text from HTML…")
    text = extract_text(html)
    if not text.strip():
        on_progress("failed", "No text extracted from page. Skipping.")
        return []
    on_progress("scraping", f"Extracted {len(text)} chars of text.")

    # 3. Send to LLM for product extraction
    on_progress("extracting", "Sending to LLM for product extraction…")
    products = await extract_products(text, category, shop.name)

    if not products:
        on_progress("extracting", "No products extracted. Skipping.")
        return []

    # 4. Limit to max_products
    if len(products) > max_products:
        on_progress(
            "extracting", f"Trimming {len(products)} products to {max_products}."
        )
        products = products[:max_products]

    # Inject affiliate tags
    for p in products:
        p.affiliate_url = shop.inject_affiliate_tag(p.affiliate_url)

    on_progress("extracting", f"Extracted {len(products)} product(s).")

    on_progress(
        "completed",
        f"Extraction complete — {len(products)} products ready for review.",
    )
    return products


async def run_urls(
    urls: list[str],
    category: str,
    shop_name: str,
    *,
    progress: ProgressCallback | None = None,
) -> list[ProductData]:
    """Fetch specific product URLs, extract text, and send to LLM for extraction.

    This allows users to manually specify product URLs instead of relying on search.
    Returns a list of ProductData without publishing (for review workflow).
    """
    on_progress = progress or _noop_progress

    shop = get_shop(shop_name)
    category_id = _resolve_category_id(category)

    on_progress(
        "init",
        f"Manual URL import: {len(urls)} URL(s) | Shop: {shop.name} | Category: {category}",
        {
            "shop": shop.name,
            "shopId": shop.shop_id,
            "category": category,
            "categoryId": category_id,
            "urlCount": len(urls),
        },
    )

    all_products: list[ProductData] = []

    for i, url in enumerate(urls):
        on_progress("scraping", f"Fetching URL {i + 1}/{len(urls)}: {url[:80]}...")
        try:
            html = await fetch_page(url)
        except Exception as e:
            on_progress("scraping", f"Failed to fetch {url}: {e}")
            continue

        text = extract_text(html)
        if not text.strip():
            on_progress("scraping", f"No text extracted from {url}. Skipping.")
            continue

        on_progress("extracting", f"Extracting product data from URL {i + 1}...")
        products = await extract_products(text, category, shop.name)

        if products:
            # Inject affiliate tags and take first product per page (usually one product per URL)
            for p in products[:1]:  # Limit to 1 product per URL
                p.affiliate_url = shop.inject_affiliate_tag(p.affiliate_url or url)
                all_products.append(p)
            on_progress("extracting", f"Extracted product: {products[0].name}")
        else:
            on_progress("extracting", f"No product extracted from {url}")

        # Small delay between requests
        if i < len(urls) - 1:
            await asyncio.sleep(1)

    on_progress(
        "completed",
        f"Extraction complete — {len(all_products)} products ready for review.",
        {"productCount": len(all_products)},
    )

    return all_products


async def extract_single_url(
    url: str,
    categories: list[dict[str, str]],
    *,
    progress: ProgressCallback | None = None,
) -> tuple[ProductData | None, str | None]:
    """Fetch a single URL, extract product data, and suggest a category.

    Unlike run_urls(), this does not require a shop or category upfront.
    The LLM determines the best category from the provided list.

    Returns (product, suggested_category_id) or (None, None) on failure.
    """
    on_progress = progress or _noop_progress

    on_progress(
        "init",
        f"URL extraction: {url[:80]}",
        {"url": url, "categoryCount": len(categories)},
    )

    # 1. Fetch page
    on_progress("scraping", f"Fetching page: {url[:80]}…")
    try:
        html = await fetch_page(url)
    except Exception as e:
        on_progress("failed", f"Failed to fetch page: {e}")
        return None, None

    # 2. Extract text
    on_progress("scraping", "Extracting text from HTML…")
    text = extract_text(html)
    if not text.strip():
        on_progress("failed", "No text extracted from page.")
        return None, None
    on_progress("scraping", f"Extracted {len(text)} chars of text.")

    # 3. LLM extraction with category suggestion
    on_progress(
        "extracting", "Sending to LLM for product extraction + category suggestion…"
    )
    product, suggested_category_id = await extract_product_with_category(
        text, url, categories
    )

    if not product:
        on_progress("failed", "Could not extract product information from this URL.")
        return None, None

    # Ensure affiliate_url is set (use the original URL if LLM didn't find one)
    if not product.affiliate_url:
        product.affiliate_url = url

    on_progress(
        "extracting",
        f"Extracted product: {product.name}",
        {"suggestedCategoryId": suggested_category_id},
    )

    on_progress(
        "completed",
        "Extraction complete — 1 product ready for review.",
        {"productCount": 1, "suggestedCategoryId": suggested_category_id},
    )

    return product, suggested_category_id
