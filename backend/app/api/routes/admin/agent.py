"""Admin routes that proxy to the agent microservice."""

import hashlib
import logging
from datetime import datetime, timezone
from urllib.parse import urlparse

import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_admin, _find_or_create_user
from app.config import settings
from app.database import get_session
from app.models.product import Product
from app.models.product_bike_type import ProductBikeType
from app.models.product_category import ProductCategory
from app.models.shop import Shop
from app.models.user import User
from app.schemas.product import (
    BulkProductItem,
    BulkProductResponse,
    ProductAdminResponse,
    ShopAdminResponse,
)
from app.services.auth import AuthenticationError, auth_service
from app.services.shop_detection import detect_shop_by_url, check_duplicate_product

# Re-use the bulk import logic from the products route inline
from app.api.routes.admin.products import bulk_import_products as _bulk_import
from app.api.routes.admin.products import CATEGORY_ZONE, _load_bike_types

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/agent", tags=["admin-agent"])

AGENT_TIMEOUT = 10.0


async def _agent_get(path: str) -> dict | list:
    """GET from the agent service."""
    url = f"{settings.AGENT_SERVICE_URL.rstrip('/')}{path}"
    async with httpx.AsyncClient(timeout=AGENT_TIMEOUT) as client:
        try:
            resp = await client.get(url)
            resp.raise_for_status()
            return resp.json()
        except httpx.ConnectError:
            raise HTTPException(status_code=502, detail="Agent service is unavailable")
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=e.response.text,
            )


async def _agent_post(path: str, payload: dict) -> dict:
    """POST to the agent service."""
    url = f"{settings.AGENT_SERVICE_URL.rstrip('/')}{path}"
    async with httpx.AsyncClient(timeout=AGENT_TIMEOUT) as client:
        try:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            return resp.json()
        except httpx.ConnectError:
            raise HTTPException(status_code=502, detail="Agent service is unavailable")
        except httpx.HTTPStatusError as e:
            raise HTTPException(
                status_code=e.response.status_code,
                detail=e.response.text,
            )


# --- Proxied endpoints ---


@router.get("/shops")
async def get_agent_shops(
    _admin: User = Depends(require_admin),
) -> list:
    return await _agent_get("/shops")


@router.get("/categories")
async def get_agent_categories(
    _admin: User = Depends(require_admin),
) -> list:
    return await _agent_get("/categories")


class StartJobRequest(BaseModel):
    shop: str
    category: str
    maxProducts: int = Field(default=5, ge=1, le=50)


class StartUrlJobRequest(BaseModel):
    shop: str
    category: str
    urls: list[str] = Field(..., min_length=1, max_length=20)


@router.get("/jobs")
async def list_agent_jobs(
    _admin: User = Depends(require_admin),
) -> list:
    return await _agent_get("/jobs")


@router.post("/jobs")
async def start_agent_job(
    request: StartJobRequest,
    _admin: User = Depends(require_admin),
) -> dict:
    return await _agent_post("/jobs", request.model_dump())


@router.post("/jobs/urls")
async def start_agent_url_job(
    request: StartUrlJobRequest,
    _admin: User = Depends(require_admin),
) -> dict:
    return await _agent_post("/jobs/urls", request.model_dump())


class StartExtractUrlRequest(BaseModel):
    url: str


@router.post("/jobs/extract-url")
async def start_extract_url_job(
    request: StartExtractUrlRequest,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> dict:
    """Start a job that extracts a single product from any URL.

    Fetches the category list from the DB and forwards it to the agent.
    """
    url = request.url.strip()
    parsed = urlparse(url)
    if parsed.scheme not in ("http", "https") or not parsed.hostname:
        raise HTTPException(status_code=400, detail="Invalid URL format")

    # Fetch categories from DB to pass to agent for suggestion
    result = await session.execute(
        select(ProductCategory).order_by(ProductCategory.display_order)
    )
    categories = [
        {"id": cat.id, "name": cat.name, "slug": cat.slug}
        for cat in result.scalars().all()
    ]

    return await _agent_post(
        "/jobs/extract-url",
        {"url": url, "categories": categories},
    )


@router.get("/jobs/{job_id}")
async def get_agent_job(
    job_id: str,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> dict:
    job_data = await _agent_get(f"/jobs/{job_id}")

    # Enrich extract-url jobs with shop detection and duplicate check
    if isinstance(job_data, dict) and "suggestedCategoryId" in job_data:
        url = job_data.get("url", "")
        if url:
            shop_info = await detect_shop_by_url(url, session)
            job_data["suggestedShop"] = shop_info

            # Check for duplicate by affiliate URL from products
            products = job_data.get("products") or []
            if products and len(products) > 0:
                affiliate_url = products[0].get("affiliateUrl", "")
                duplicate = await check_duplicate_product(affiliate_url, session)
                job_data["duplicateOf"] = duplicate

    return job_data


async def _require_admin_from_token(
    token: str | None = None,
    session: AsyncSession = Depends(get_session),
) -> User:
    """Validate admin from a query-string token (for SSE endpoints where
    the browser's EventSource API cannot send Authorization headers)."""
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )
    try:
        claims = auth_service.validate_token(token)
    except AuthenticationError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    user = await _find_or_create_user(claims, session)
    if not user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user


@router.get("/jobs/{job_id}/stream")
async def stream_agent_job(
    job_id: str,
    _admin: User = Depends(_require_admin_from_token),
) -> StreamingResponse:
    """Proxy SSE stream from the agent service to the frontend."""
    url = f"{settings.AGENT_SERVICE_URL.rstrip('/')}/jobs/{job_id}/stream"

    async def event_proxy():
        async with httpx.AsyncClient(timeout=None) as client:
            try:
                async with client.stream("GET", url) as response:
                    if response.status_code != 200:
                        return
                    async for line in response.aiter_lines():
                        yield line + "\n"
            except httpx.ConnectError:
                yield 'event: error\ndata: {"message": "Agent service unavailable"}\n\n'

    return StreamingResponse(
        event_proxy(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


class ApproveImportRequest(BaseModel):
    products: list[BulkProductItem]
    categoryId: str
    shopId: str
    replaceCategory: bool = True


@router.post("/jobs/{job_id}/approve", response_model=BulkProductResponse)
async def approve_agent_import(
    job_id: str,
    request: ApproveImportRequest,
    admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> BulkProductResponse:
    """Approve and publish products extracted by the agent.

    This reuses the existing bulk import logic directly — no HTTP round-trip.
    """
    replace_cat = request.categoryId if request.replaceCategory else None
    return await _bulk_import(
        items=request.products,
        replace_category=replace_cat,
        _admin=admin,
        session=session,
    )


# --- URL Import approval (single product) ---


class NewShopData(BaseModel):
    name: str


class ApproveUrlProductData(BaseModel):
    name: str
    description: str = ""
    imageUrl: str = ""
    affiliateUrl: str = ""
    matchesLabel: str = "Cycling Product"
    matchesItemId: str | None = None
    bikeTypes: list[str] = []
    weatherTempMin: float | None = None
    weatherTempMax: float | None = None
    weatherPrecipitation: str = "none"
    weatherWind: str = "none"
    weatherSummary: str = ""


class ApproveUrlImportRequest(BaseModel):
    product: ApproveUrlProductData
    categoryId: str
    shopId: str | None = None
    newShop: NewShopData | None = None


class ApproveUrlImportResponse(BaseModel):
    product: ProductAdminResponse
    shopCreated: bool


def _generate_product_id(affiliate_url: str, name: str) -> str:
    """Generate a deterministic product ID (mirrors agent logic)."""
    key = affiliate_url if affiliate_url else name
    h = hashlib.sha256(key.encode()).hexdigest()[:12]
    return f"agent-{h}"


@router.post("/jobs/{job_id}/approve-url", response_model=ApproveUrlImportResponse)
async def approve_url_import(
    job_id: str,
    request: ApproveUrlImportRequest,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> ApproveUrlImportResponse:
    """Approve a single product extracted by the URL import job."""
    shop_created = False

    # Resolve shop
    if request.newShop:
        # Create new shop
        domain = None
        if request.product.affiliateUrl:
            parsed = urlparse(request.product.affiliateUrl)
            hostname = parsed.hostname or ""
            domain = hostname[4:] if hostname.startswith("www.") else hostname

        shop_id = _generate_shop_id(request.newShop.name)
        shop = Shop(
            id=shop_id,
            name=request.newShop.name,
            logo_url="",
            affiliate_tag=None,
            base_url=domain,
        )
        session.add(shop)
        await session.flush()
        shop_created = True
    elif request.shopId:
        shop_id = request.shopId
        # Verify shop exists
        result = await session.execute(select(Shop).where(Shop.id == shop_id))
        shop = result.scalars().first()
        if not shop:
            raise HTTPException(status_code=400, detail=f"Shop '{shop_id}' not found")

        # Apply affiliate tag if shop has one
        if shop.affiliate_tag and request.product.affiliateUrl:
            url = request.product.affiliateUrl
            separator = "&" if "?" in url else "?"
            request.product.affiliateUrl = f"{url}{separator}tag={shop.affiliate_tag}"
    else:
        raise HTTPException(
            status_code=400, detail="Either shopId or newShop must be provided"
        )

    # Generate product ID and determine zone
    product_id = _generate_product_id(
        request.product.affiliateUrl, request.product.name
    )
    matches_zone = CATEGORY_ZONE.get(request.categoryId)

    now = datetime.now(timezone.utc).replace(tzinfo=None)

    # Check if product already exists (upsert)
    result = await session.execute(select(Product).where(Product.id == product_id))
    existing = result.scalars().first()

    if existing:
        existing.name = request.product.name
        existing.category_id = request.categoryId
        existing.image_url = request.product.imageUrl
        existing.shop_id = shop_id
        existing.affiliate_url = request.product.affiliateUrl
        existing.matches_zone = matches_zone
        existing.matches_item_id = request.product.matchesItemId
        existing.matches_label = request.product.matchesLabel
        existing.weather_temp_min = request.product.weatherTempMin
        existing.weather_temp_max = request.product.weatherTempMax
        existing.weather_precipitation = request.product.weatherPrecipitation
        existing.weather_wind = request.product.weatherWind
        existing.weather_summary = request.product.weatherSummary
        existing.is_published = True
        existing.updated_at = now
        # Update bike types
        old_bt = await session.execute(
            select(ProductBikeType).where(ProductBikeType.product_id == existing.id)
        )
        for bt_row in old_bt.scalars().all():
            await session.delete(bt_row)
        for bt in request.product.bikeTypes:
            session.add(ProductBikeType(product_id=existing.id, bike_type=bt))
        product = existing
    else:
        product = Product(
            id=product_id,
            name=request.product.name,
            category_id=request.categoryId,
            image_url=request.product.imageUrl,
            shop_id=shop_id,
            affiliate_url=request.product.affiliateUrl,
            matches_zone=matches_zone,
            matches_item_id=request.product.matchesItemId,
            matches_label=request.product.matchesLabel,
            weather_temp_min=request.product.weatherTempMin,
            weather_temp_max=request.product.weatherTempMax,
            weather_precipitation=request.product.weatherPrecipitation,
            weather_wind=request.product.weatherWind,
            weather_summary=request.product.weatherSummary,
            is_published=True,
            created_at=now,
            updated_at=now,
        )
        session.add(product)
        for bt in request.product.bikeTypes:
            session.add(ProductBikeType(product_id=product_id, bike_type=bt))

    await session.commit()
    await session.refresh(product)
    bt_map = await _load_bike_types(session, [product.id])

    return ApproveUrlImportResponse(
        product=ProductAdminResponse.from_model(
            product, bike_types=bt_map.get(product.id)
        ),
        shopCreated=shop_created,
    )


def _generate_shop_id(name: str) -> str:
    """Generate a shop ID from a name."""
    import re

    slug = re.sub(r"[^a-z0-9-]", "-", name.lower()).strip("-")
    slug = re.sub(r"-+", "-", slug)
    return f"shop-{slug}"
