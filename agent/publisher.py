"""Publish extracted products to the backend admin bulk API."""

import logging

import httpx
from pydantic import BaseModel
from rich.console import Console
from rich.table import Table

from agent.config import settings
from agent.extractor import ProductData, _generate_product_id

logger = logging.getLogger(__name__)
console = Console()


class BulkResult(BaseModel):
    """Result from the bulk import API."""

    created: int = 0
    updated: int = 0
    deleted: int = 0
    skipped: int = 0
    errors: list[str] = []


def _build_bulk_payload(
    products: list[ProductData],
    category_id: str,
    shop_id: str,
    *,
    publish: bool = True,
) -> list[dict]:
    """Convert ProductData list into the BulkProductItem payload expected by the API."""
    items = []
    for p in products:
        product_id = _generate_product_id(p.affiliate_url, p.name)
        items.append(
            {
                "id": product_id,
                "name": p.name,
                "categoryId": category_id,
                "imageUrl": p.image_url,
                "price": p.price,
                "currency": p.currency,
                "shopId": shop_id,
                "affiliateUrl": p.affiliate_url,
                "matchesZone": None,
                "matchesLabel": "all-conditions",
                "weatherTempMin": None,
                "weatherTempMax": None,
                "weatherPrecipitation": "none",
                "weatherWind": "none",
                "weatherSummary": p.description,
                "isPublished": publish,
            }
        )
    return items


async def publish_products(
    products: list[ProductData],
    category_id: str,
    shop_id: str,
    api_url: str | None = None,
    token: str | None = None,
    *,
    publish: bool = True,
) -> BulkResult:
    """POST products to /api/admin/products/bulk.

    Replaces all existing products in the category with the new set.
    Returns a BulkResult with created/updated/deleted/error counts.
    """
    url = api_url or settings.admin_api_url
    auth_token = token or settings.admin_token
    endpoint = f"{url.rstrip('/')}/products/bulk?replaceCategory={category_id}"
    payload = _build_bulk_payload(products, category_id, shop_id, publish=publish)

    if not payload:
        return BulkResult(skipped=0)

    headers: dict[str, str] = {
        "Content-Type": "application/json",
    }
    if auth_token:
        headers["Authorization"] = f"Bearer {auth_token}"
    elif settings.admin_dev_email:
        # Local dev bypass: backend must have DEBUG=True
        headers["X-Dev-User-Email"] = settings.admin_dev_email
    else:
        return BulkResult(
            errors=[
                "No auth configured. Set AGENT_ADMIN_TOKEN or AGENT_ADMIN_DEV_EMAIL in .env"
            ]
        )

    try:
        async with httpx.AsyncClient(timeout=settings.request_timeout) as client:
            response = await client.post(endpoint, json=payload, headers=headers)
            response.raise_for_status()
            data = response.json()
            return BulkResult(
                created=data.get("created", 0),
                updated=data.get("updated", 0),
                deleted=data.get("deleted", 0),
                errors=data.get("errors", []),
            )
    except httpx.HTTPStatusError as e:
        logger.error("API error %s: %s", e.response.status_code, e.response.text[:500])
        return BulkResult(
            errors=[f"HTTP {e.response.status_code}: {e.response.text[:200]}"]
        )
    except Exception as e:
        logger.error("Failed to publish products: %s", e)
        return BulkResult(errors=[str(e)])


def _display_products_table(products: list[ProductData]) -> None:
    """Print a rich table of extracted products for review."""
    table = Table(title="Extracted Products", show_lines=True)
    table.add_column("#", style="dim", width=4)
    table.add_column("Name", style="bold", max_width=40)
    table.add_column("Price", justify="right", width=10)
    table.add_column("Description", max_width=50)
    table.add_column("URL", max_width=40)

    for i, p in enumerate(products, 1):
        table.add_row(
            str(i),
            p.name,
            f"{p.price:.2f} {p.currency}",
            p.description[:50] + ("…" if len(p.description) > 50 else ""),
            p.affiliate_url[:40] + ("…" if len(p.affiliate_url) > 40 else ""),
        )

    console.print(table)


async def publish_with_review(
    products: list[ProductData],
    category_id: str,
    shop_id: str,
    *,
    publish: bool = True,
) -> BulkResult:
    """Interactive mode: display products, ask for confirmation, then publish.

    User can:
    - 'y' / 'yes' to publish all
    - 'n' / 'no' to cancel
    - Comma-separated numbers to skip specific items (e.g., '2,5' skips items 2 and 5)
    """
    if not products:
        console.print("[yellow]No products to review.[/yellow]")
        return BulkResult()

    _display_products_table(products)
    console.print()

    response = (
        console.input(
            "[bold]Publish all? (y/n) or enter numbers to skip (e.g. 2,5): [/bold]"
        )
        .strip()
        .lower()
    )

    if response in ("n", "no"):
        console.print("[red]Cancelled.[/red]")
        return BulkResult(skipped=len(products))

    approved = list(products)
    skipped = 0

    if response not in ("y", "yes", ""):
        # Parse skip indices
        try:
            skip_indices = {int(x.strip()) for x in response.split(",")}
            approved = [p for i, p in enumerate(products, 1) if i not in skip_indices]
            skipped = len(products) - len(approved)
            console.print(f"[yellow]Skipping {skipped} product(s).[/yellow]")
        except ValueError:
            console.print("[red]Invalid input. Publishing all.[/red]")

    result = await publish_products(approved, category_id, shop_id, publish=publish)
    result.skipped = skipped
    return result
