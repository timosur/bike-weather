"""CLI entry point for the product agent."""

import argparse
import asyncio
import logging
import sys

from rich.console import Console
from rich.logging import RichHandler

from agent.config import settings
from agent.extractor import extract_products
from agent.publisher import publish_products, publish_with_review
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
    "headwear": "cat-headwear",
    "cycling-shoes-overshoes": "cat-shoes",
    "shoes": "cat-shoes",
    "overshoes": "cat-shoes",
    "bike-lights": "cat-lights",
    "lights": "cat-lights",
    "accessories-gear": "cat-accessories",
    "accessories": "cat-accessories",
    "rain-gear": "cat-jackets",  # rain gear defaults to jackets category
}


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
    return f"cycling {category.replace('-', ' ')}"


def _setup_logging(verbose: bool) -> None:
    level = logging.DEBUG if verbose else logging.INFO
    logging.basicConfig(
        level=level,
        format="%(message)s",
        handlers=[RichHandler(console=console, rich_tracebacks=True)],
    )


async def run(args: argparse.Namespace) -> None:
    """Main async workflow."""
    shop = get_shop(args.shop)
    category_id = _resolve_category_id(args.category)
    search_query = _build_search_query(args.category)
    search_url = shop.search_url(search_query)

    console.print(f"[bold]Shop:[/bold] {shop.name}")
    console.print(f"[bold]Category:[/bold] {args.category} → {category_id}")
    console.print(f"[bold]Search URL:[/bold] {search_url}")
    console.print()

    # 1. Fetch search results page
    console.print("[dim]Fetching search results…[/dim]")
    try:
        html = await fetch_page(search_url)
    except Exception as e:
        console.print(f"[red]Failed to fetch page: {e}[/red]")
        sys.exit(1)

    # 2. Extract text from HTML
    console.print("[dim]Extracting text from HTML…[/dim]")
    text = extract_text(html)
    if not text.strip():
        console.print("[yellow]No text extracted from page. Aborting.[/yellow]")
        sys.exit(1)
    console.print(f"[dim]Extracted {len(text)} chars of text.[/dim]")

    # 3. Send to LLM for product extraction
    console.print("[dim]Sending to LLM for product extraction…[/dim]")
    products = await extract_products(text, args.category, shop.name)

    if not products:
        console.print("[yellow]No products extracted. Aborting.[/yellow]")
        sys.exit(0)

    # Inject affiliate tags
    for p in products:
        p.affiliate_url = shop.inject_affiliate_tag(p.affiliate_url)

    console.print(f"[green]Extracted {len(products)} product(s).[/green]")

    # 4. Publish or review
    if args.review:
        result = await publish_with_review(products, category_id, shop.shop_id)
    else:
        result = await publish_products(products, category_id, shop.shop_id)

    # 5. Summary
    console.print()
    console.print("[bold]Result:[/bold]")
    console.print(f"  Created: {result.created}")
    console.print(f"  Updated: {result.updated}")
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
    parser.add_argument(
        "--category",
        required=True,
        help="Product category slug (e.g. 'rain-gear', 'cycling-jackets', 'gloves')",
    )
    parser.add_argument(
        "--shop",
        required=True,
        choices=list_shops(),
        help="Shop to search (e.g. 'amazon', 'bike24')",
    )
    parser.add_argument(
        "--review",
        action="store_true",
        default=False,
        help="Interactive review mode: display products before publishing",
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
