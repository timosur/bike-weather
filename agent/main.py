"""CLI entry point for the product agent."""

import argparse
import asyncio
import logging
import sys

from rich.console import Console
from rich.logging import RichHandler

from agent.config import settings
from agent.extractor import extract_products
from agent.publisher import BulkResult, publish_products, publish_with_review
from agent.scraper import extract_text, fetch_page
from agent.shops import get_shop, list_shops

console = Console()

# Known category slug → category_id mapping (matches backend seed data)
CATEGORY_MAP: dict[str, str] = {
    "cycling-jackets": "cat-jackets",
    "jackets": "cat-jackets",
    "cycling-gloves": "cat-gloves",
    "gloves": "cat-gloves",
    "cycling-tights": "cat-pants",
    "tights": "cat-pants",
    "pants": "cat-pants",
    "hats-caps": "cat-headwear",
    "cycling-shoes-overshoes": "cat-shoes",
    "shoes": "cat-shoes",
    "overshoes": "cat-shoes",
    "bike-lights": "cat-lights",
    "lights": "cat-lights",
    "accessories-gear": "cat-accessories",
    "accessories": "cat-accessories",
    "rain-gear": "cat-jackets",  # rain gear defaults to jackets category
}

# Canonical list: one slug per unique backend category (used by --all)
ALL_CATEGORIES: list[str] = [
    "cycling-jackets",
    "cycling-gloves",
    "cycling-tights",
    "hats-caps",
    "cycling-shoes-overshoes",
    "bike-lights",
    "accessories-gear",
]

DEFAULT_MAX_PRODUCTS = 5


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
) -> BulkResult:
    """Run the full scrape → extract → publish pipeline for a single category.

    Returns a BulkResult with created/updated/error counts.
    """
    shop = get_shop(shop_name)
    category_id = _resolve_category_id(category)
    search_query = _build_search_query(category)
    search_url = shop.search_url(search_query)

    console.print(f"[bold]Shop:[/bold] {shop.name}")
    console.print(f"[bold]Category:[/bold] {category} → {category_id}")
    console.print(f"[bold]Search URL:[/bold] {search_url}")
    console.print(f"[bold]Max products:[/bold] {max_products}")
    console.print()

    # 1. Fetch search results page
    console.print("[dim]Fetching search results…[/dim]")
    try:
        html = await fetch_page(search_url)
    except Exception as e:
        console.print(f"[red]Failed to fetch page: {e}[/red]")
        return BulkResult(errors=[f"Fetch failed for {category}: {e}"])

    # 2. Extract text from HTML
    console.print("[dim]Extracting text from HTML…[/dim]")
    text = extract_text(html)
    if not text.strip():
        console.print("[yellow]No text extracted from page. Skipping.[/yellow]")
        return BulkResult()
    console.print(f"[dim]Extracted {len(text)} chars of text.[/dim]")

    # 3. Send to LLM for product extraction
    console.print("[dim]Sending to LLM for product extraction…[/dim]")
    products = await extract_products(text, category, shop.name)

    if not products:
        console.print("[yellow]No products extracted. Skipping.[/yellow]")
        return BulkResult()

    # 4. Limit to max_products
    if len(products) > max_products:
        console.print(
            f"[dim]Trimming {len(products)} products to {max_products}.[/dim]"
        )
        products = products[:max_products]

    # Inject affiliate tags
    for p in products:
        p.affiliate_url = shop.inject_affiliate_tag(p.affiliate_url)

    console.print(f"[green]Extracted {len(products)} product(s).[/green]")

    # 5. Publish or review
    if review:
        result = await publish_with_review(
            products, category_id, shop.shop_id, publish=publish
        )
    else:
        result = await publish_products(
            products, category_id, shop.shop_id, publish=publish
        )

    return result


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

    cat_group = parser.add_mutually_exclusive_group(required=True)
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
        required=True,
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

    # Validate settings
    if not settings.llm_api_key:
        console.print("[red]Error: AGENT_LLM_API_KEY is not set.[/red]")
        sys.exit(1)

    asyncio.run(run(args))
