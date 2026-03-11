"""CLI entry point for the product agent."""

import argparse
import asyncio
import logging
import sys
from collections.abc import Callable
from typing import Any

from rich.console import Console
from rich.logging import RichHandler

from agent.config import settings
from agent.extractor import ProductData, extract_products
from agent.publisher import BulkResult, publish_products, publish_with_review
from agent.scraper import extract_text, fetch_page
from agent.shops import get_shop, list_shops

console = Console()

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


def _cli_progress(stage: str, message: str, data: dict[str, Any] | None = None) -> None:
    """Default progress callback that prints via Rich console."""
    console.print(f"[dim]{message}[/dim]")


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


def _setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(message)s",
        handlers=[RichHandler(console=console, rich_tracebacks=True)],
    )


async def run_category(
    category: str,
    shop_name: str,
    *,
    max_products: int = DEFAULT_MAX_PRODUCTS,
    review: bool = False,
    publish: bool = True,
    progress: ProgressCallback | None = None,
    extract_only: bool = False,
) -> BulkResult | list[ProductData]:
    """Run the full scrape → extract → publish pipeline for a single category.

    If *extract_only* is True, returns the list of ProductData without publishing
    (used by the HTTP server for the review workflow).
    Otherwise returns a BulkResult with created/updated/error counts.
    """
    on_progress = progress or _cli_progress

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
        if extract_only:
            return []
        return BulkResult(errors=[f"Fetch failed for {category}: {e}"])

    # 2. Extract text from HTML
    on_progress("scraping", "Extracting text from HTML…")
    text = extract_text(html)
    if not text.strip():
        on_progress("failed", "No text extracted from page. Skipping.")
        if extract_only:
            return []
        return BulkResult()
    on_progress("scraping", f"Extracted {len(text)} chars of text.")

    # 3. Send to LLM for product extraction
    on_progress("extracting", "Sending to LLM for product extraction…")
    products = await extract_products(text, category, shop.name)

    if not products:
        on_progress("extracting", "No products extracted. Skipping.")
        if extract_only:
            return []
        return BulkResult()

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

    # If extract_only, return raw products for review workflow
    if extract_only:
        on_progress(
            "completed",
            f"Extraction complete — {len(products)} products ready for review.",
        )
        return products

    # 5. Publish or review (CLI flow)
    on_progress("publishing", "Publishing products…")
    if review:
        result = await publish_with_review(
            products, category_id, shop.shop_id, publish=publish
        )
    else:
        result = await publish_products(
            products, category_id, shop.shop_id, publish=publish
        )

    return result


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
    on_progress = progress or _cli_progress

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


async def run_all(
    shop_name: str,
    *,
    max_products: int = DEFAULT_MAX_PRODUCTS,
    delay: float = 2.0,
    publish: bool = True,
) -> None:
    """Iterate over ALL_CATEGORIES, importing up to *max_products* per category."""
    total = BulkResult()

    for i, category in enumerate(ALL_CATEGORIES):
        console.rule(
            f"[bold cyan]Category {i + 1}/{len(ALL_CATEGORIES)}: {category}[/bold cyan]"
        )

        result = await run_category(
            category,
            shop_name,
            max_products=max_products,
            review=False,
            publish=publish,
        )
        # run_category returns BulkResult when extract_only=False (default)
        assert isinstance(result, BulkResult)

        total.created += result.created
        total.updated += result.updated
        total.deleted += result.deleted
        total.skipped += result.skipped
        total.errors.extend(result.errors)

        _print_result(result)

        # Polite delay between categories to avoid hammering the shop
        if i < len(ALL_CATEGORIES) - 1:
            console.print(f"[dim]Waiting {delay}s before next category…[/dim]\n")
            await asyncio.sleep(delay)

    # Grand total
    console.rule("[bold green]All categories complete[/bold green]")
    console.print(f"[bold]Total created:[/bold] {total.created}")
    console.print(f"[bold]Total updated:[/bold] {total.updated}")
    console.print(f"[bold]Total deleted:[/bold] {total.deleted}")
    console.print(f"[bold]Total skipped:[/bold] {total.skipped}")
    if total.errors:
        console.print(f"[bold red]Total errors:[/bold red] {len(total.errors)}")
        for err in total.errors:
            console.print(f"  - {err}")


async def run(args: argparse.Namespace) -> None:
    """Main async workflow — delegates to run_all or run_category."""
    if args.all:
        await run_all(
            args.shop,
            max_products=args.max_products,
            delay=settings.request_delay,
            publish=not args.draft,
        )
        return

    result = await run_category(
        args.category,
        args.shop,
        max_products=args.max_products,
        review=args.review,
        publish=not args.draft,
    )
    # CLI mode always gets BulkResult
    assert isinstance(result, BulkResult)
    _print_result(result)


def _print_result(result: BulkResult) -> None:
    """Pretty-print a single BulkResult."""
    console.print()
    console.print("[bold]Result:[/bold]")
    console.print(f"  Created: {result.created}")
    console.print(f"  Updated: {result.updated}")
    console.print(f"  Deleted: {result.deleted}")
    console.print(f"  Skipped: {result.skipped}")
    if result.errors:
        console.print(f"  [red]Errors: {len(result.errors)}[/red]")
        for err in result.errors:
            console.print(f"    - {err}")


def main() -> None:
    """Parse CLI arguments and run the agent."""
    parser = argparse.ArgumentParser(
        prog="agent",
        description="LLM-powered product agent for Bike Weather",
    )

    # Server mode
    parser.add_argument(
        "--serve",
        action="store_true",
        default=False,
        help="Start the agent as an HTTP server instead of running a scrape",
    )
    parser.add_argument(
        "--port",
        type=int,
        default=8001,
        help="Port for the HTTP server (default: 8001, only used with --serve)",
    )
    parser.add_argument(
        "--host",
        default="127.0.0.1",
        help="Host for the HTTP server (default: 127.0.0.1, only used with --serve)",
    )

    cat_group = parser.add_mutually_exclusive_group(required=False)
    cat_group.add_argument(
        "--category",
        help="Product category slug (e.g. 'cycling-jackets', 'gloves')",
    )
    cat_group.add_argument(
        "--all",
        action="store_true",
        default=False,
        help="Run for ALL product categories automatically",
    )

    parser.add_argument(
        "--shop",
        choices=list_shops(),
        help="Shop to search (e.g. 'bike-components')",
    )
    parser.add_argument(
        "--max-products",
        type=int,
        default=DEFAULT_MAX_PRODUCTS,
        help=f"Maximum products to import per category (default: {DEFAULT_MAX_PRODUCTS})",
    )
    parser.add_argument(
        "--review",
        action="store_true",
        default=False,
        help="Interactive review mode: display products before publishing",
    )
    parser.add_argument(
        "--draft",
        action="store_true",
        default=False,
        help="Import products as unpublished drafts (default: publish immediately)",
    )
    parser.add_argument(
        "--verbose",
        "-v",
        action="store_true",
        default=False,
        help="Enable verbose/debug logging",
    )
    args = parser.parse_args()

    _setup_logging(args.verbose)

    # Server mode: start HTTP server and return
    if args.serve:
        import uvicorn

        from agent.server import app as server_app

        console.print(
            f"[bold green]Starting agent HTTP server on {args.host}:{args.port}[/bold green]"
        )
        uvicorn.run(server_app, host=args.host, port=args.port, log_level="info")
        return

    # CLI mode: validate required args
    if not args.category and not args.all:
        parser.error("--category or --all is required (unless using --serve)")
    if not args.shop:
        parser.error("--shop is required (unless using --serve)")

    # Validate settings
    if not settings.llm_api_key:
        console.print("[red]Error: AGENT_LLM_API_KEY is not set.[/red]")
        sys.exit(1)

    asyncio.run(run(args))
