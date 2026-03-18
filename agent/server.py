"""FastAPI HTTP server wrapping the agent pipeline."""

import asyncio
import json
import logging

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from sse_starlette.sse import EventSourceResponse

from agent.extractor import ProductData, _generate_product_id
from agent.job_manager import Job, JobManager, JobStatus, job_manager
from agent.main import (
    ALL_CATEGORIES,
    CATEGORY_MAP,
    _resolve_category_id,
    extract_single_url,
    run_category,
    run_urls,
)
from agent.shops import get_shop, list_shops

logger = logging.getLogger(__name__)

app = FastAPI(title="Bike Weather Agent", version="0.1.0")


# --- Schemas ---


class StartJobRequest(BaseModel):
    shop: str
    category: str
    maxProducts: int = Field(default=5, ge=1, le=50)
    itemIds: dict[str, str] | None = Field(default=None)


class StartUrlJobRequest(BaseModel):
    shop: str
    category: str
    urls: list[str] = Field(..., min_length=1, max_length=20)
    itemIds: dict[str, str] | None = Field(default=None)


class ExtractUrlCategory(BaseModel):
    id: str
    name: str
    slug: str


class StartExtractUrlRequest(BaseModel):
    url: str
    categories: list[ExtractUrlCategory] = Field(default_factory=list)
    itemIds: dict[str, str] | None = Field(default=None)


class StartJobResponse(BaseModel):
    jobId: str
    status: str


class ShopInfo(BaseModel):
    id: str
    name: str


class CategoryInfo(BaseModel):
    slug: str
    categoryId: str
    label: str


# --- Helpers ---

# Category ID → body zone mapping (deterministic, no LLM needed)
CATEGORY_ZONE_MAP: dict[str, str | None] = {
    # Upper body
    "cat-rain-jackets": "upperBody",
    "cat-wind-jackets": "upperBody",
    "cat-thermal-jackets": "upperBody",
    "cat-jerseys": "upperBody",
    "cat-base-layers": "upperBody",
    "cat-vests": "upperBody",
    # Lower body
    "cat-thermal-tights": "lowerBody",
    "cat-cycling-shorts": "lowerBody",
    "cat-rain-pants": "lowerBody",
    # Hands
    "cat-winter-gloves": "hands",
    "cat-summer-gloves": "hands",
    # Head
    "cat-headwear": "head",
    # Feet
    "cat-shoe-covers": "feet",
    "cat-cycling-shoes": "feet",
    # Eyes
    "cat-eyewear": "eyes",
    # Neck / Face
    "cat-neck-face": "neck",
    # Equipment (no body zone)
    "cat-lights": None,
    "cat-accessories": None,
}


def _products_to_bulk_payload(
    products: list[ProductData], category_id: str, shop_id: str
) -> list[dict]:
    """Convert ProductData list to the BulkProductItem format expected by the backend."""
    matches_zone = CATEGORY_ZONE_MAP.get(category_id)
    items = []
    for p in products:
        product_id = _generate_product_id(p.affiliate_url, p.name)
        items.append(
            {
                "id": product_id,
                "name": p.name,
                "categoryId": category_id,
                "imageUrl": p.image_url,
                "shopId": shop_id,
                "affiliateUrl": p.affiliate_url,
                "matchesZone": matches_zone,
                "matchesItemId": p.matches_item_id,
                "matchesLabel": p.matches_label or "Cycling Product",
                "weatherTempMin": p.temp_min,
                "weatherTempMax": p.temp_max,
                "weatherPrecipitation": p.precipitation or "none",
                "weatherWind": p.wind or "none",
                "weatherSummary": p.weather_summary or p.description,
                "isPublished": True,
            }
        )
    return items


async def _run_job(job: Job, item_ids: dict[str, str] | None = None) -> None:
    """Execute the scrape/extract pipeline in the background and update the job."""
    try:
        job.status = JobStatus.SCRAPING
        job.add_progress("scraping", "Starting pipeline…")

        def progress_callback(
            stage: str, message: str, data: dict | None = None
        ) -> None:
            if stage in ("scraping", "extracting", "completed", "failed"):
                job.status = (
                    JobStatus(stage)
                    if stage != "completed" and stage != "failed"
                    else job.status
                )
            job.add_progress(stage, message, data)

        shop = get_shop(job.shop)
        category_id = _resolve_category_id(job.category)

        result = await run_category(
            job.category,
            job.shop,
            max_products=job.max_products,
            progress=progress_callback,
            item_ids=item_ids,
        )

        if result:
            job.products = _products_to_bulk_payload(result, category_id, shop.shop_id)
            job.status = JobStatus.COMPLETED
            job.add_progress(
                "completed",
                f"Extraction complete — {len(result)} products ready for review.",
                {"productCount": len(result)},
            )
        else:
            job.status = JobStatus.COMPLETED
            job.products = []
            job.add_progress("completed", "Pipeline finished with no products.")
    except Exception as e:
        logger.exception("Job %s failed", job.id)
        job.status = JobStatus.FAILED
        job.error = str(e)
        job.add_progress("failed", f"Pipeline failed: {e}")
    finally:
        job.notify_done()


async def _run_url_job(
    job: Job, urls: list[str], item_ids: dict[str, str] | None = None
) -> None:
    """Execute the URL-based extract pipeline in the background."""
    try:
        job.status = JobStatus.SCRAPING
        job.add_progress("scraping", f"Starting URL import for {len(urls)} URL(s)…")

        def progress_callback(
            stage: str, message: str, data: dict | None = None
        ) -> None:
            if stage in ("scraping", "extracting", "completed", "failed"):
                job.status = (
                    JobStatus(stage)
                    if stage != "completed" and stage != "failed"
                    else job.status
                )
            job.add_progress(stage, message, data)

        shop = get_shop(job.shop)
        category_id = _resolve_category_id(job.category)

        products = await run_urls(
            urls,
            job.category,
            job.shop,
            progress=progress_callback,
            item_ids=item_ids,
        )

        if products:
            job.products = _products_to_bulk_payload(
                products, category_id, shop.shop_id
            )
            job.status = JobStatus.COMPLETED
            job.add_progress(
                "completed",
                f"Extraction complete — {len(products)} products ready for review.",
                {"productCount": len(products)},
            )
        else:
            job.status = JobStatus.COMPLETED
            job.products = []
            job.add_progress("completed", "No products extracted from provided URLs.")
    except Exception as e:
        logger.exception("URL job %s failed", job.id)
        job.status = JobStatus.FAILED
        job.error = str(e)
        job.add_progress("failed", f"URL import failed: {e}")
    finally:
        job.notify_done()


async def _run_extract_url_job(
    job: Job,
    url: str,
    categories: list[dict[str, str]],
    item_ids: dict[str, str] | None = None,
) -> None:
    """Execute the single-URL extraction pipeline in the background."""
    try:
        job.status = JobStatus.SCRAPING

        def progress_callback(
            stage: str, message: str, data: dict | None = None
        ) -> None:
            if stage in ("scraping", "extracting", "completed", "failed"):
                job.status = (
                    JobStatus(stage)
                    if stage != "completed" and stage != "failed"
                    else job.status
                )
            job.add_progress(stage, message, data)

        product, suggested_category_id = await extract_single_url(
            url, categories, progress=progress_callback, item_ids=item_ids
        )

        if product:
            product_id = _generate_product_id(product.affiliate_url, product.name)
            item = {
                "id": product_id,
                "name": product.name,
                "imageUrl": product.image_url,
                "affiliateUrl": product.affiliate_url,
                "matchesLabel": product.matches_label or "Cycling Product",
                "matchesItemId": product.matches_item_id,
                "bikeTypes": [],
                "weatherTempMin": product.temp_min,
                "weatherTempMax": product.temp_max,
                "weatherPrecipitation": product.precipitation or "none",
                "weatherWind": product.wind or "none",
                "weatherSummary": product.weather_summary or product.description,
                "description": product.description,
                "isPublished": True,
            }
            job.products = [item]
            job.extra = {
                "suggestedCategoryId": suggested_category_id,
                "url": url,
            }
            job.status = JobStatus.COMPLETED
            job.add_progress(
                "completed",
                f"Extraction complete — product: {product.name}",
                {
                    "productCount": 1,
                    "suggestedCategoryId": suggested_category_id,
                },
            )
        else:
            job.status = JobStatus.COMPLETED
            job.products = []
            job.extra = {"suggestedCategoryId": None, "url": url}
            job.add_progress(
                "completed",
                "Could not extract product information from this URL.",
            )
    except Exception as e:
        logger.exception("Extract-URL job %s failed", job.id)
        job.status = JobStatus.FAILED
        job.error = str(e)
        job.add_progress("failed", f"URL extraction failed: {e}")
    finally:
        job.notify_done()


# --- Background cleanup ---


async def _cleanup_loop() -> None:
    while True:
        await asyncio.sleep(300)  # every 5 minutes
        removed = await job_manager.cleanup_old_jobs()
        if removed:
            logger.info("Cleaned up %d old jobs", removed)


@app.on_event("startup")
async def startup() -> None:
    asyncio.create_task(_cleanup_loop())


# --- Routes ---


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}


@app.get("/shops", response_model=list[ShopInfo])
async def get_shops() -> list[ShopInfo]:
    shops = []
    for name in list_shops():
        shop = get_shop(name)
        shops.append(ShopInfo(id=shop.shop_id, name=shop.name))
    return shops


@app.get("/categories", response_model=list[CategoryInfo])
async def get_categories() -> list[CategoryInfo]:
    categories = []
    for slug in ALL_CATEGORIES:
        cat_id = _resolve_category_id(slug)
        label = slug.replace("-", " ").title()
        categories.append(CategoryInfo(slug=slug, categoryId=cat_id, label=label))
    return categories


@app.get("/jobs")
async def list_jobs() -> list[dict]:
    """Return all jobs (newest first)."""
    jobs = await job_manager.list_jobs()
    return [job.to_dict() for job in jobs]


@app.post("/jobs", response_model=StartJobResponse)
async def start_job(request: StartJobRequest) -> StartJobResponse:
    # Validate shop exists
    try:
        get_shop(request.shop)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Validate category
    if request.category not in CATEGORY_MAP and not request.category.startswith("cat-"):
        valid = list(ALL_CATEGORIES)
        raise HTTPException(
            status_code=400,
            detail=f"Unknown category '{request.category}'. Valid: {valid}",
        )

    job = await job_manager.create_job(
        request.shop, request.category, request.maxProducts
    )
    asyncio.create_task(_run_job(job, item_ids=request.itemIds))
    return StartJobResponse(jobId=job.id, status=job.status.value)


@app.post("/jobs/urls", response_model=StartJobResponse)
async def start_url_job(request: StartUrlJobRequest) -> StartJobResponse:
    """Start a job that extracts products from specific URLs."""
    # Validate shop exists
    try:
        get_shop(request.shop)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Validate category
    if request.category not in CATEGORY_MAP and not request.category.startswith("cat-"):
        valid = list(ALL_CATEGORIES)
        raise HTTPException(
            status_code=400,
            detail=f"Unknown category '{request.category}'. Valid: {valid}",
        )

    # Validate URLs
    valid_urls = [u.strip() for u in request.urls if u.strip().startswith("http")]
    if not valid_urls:
        raise HTTPException(status_code=400, detail="No valid URLs provided")

    job = await job_manager.create_job(request.shop, request.category, len(valid_urls))
    asyncio.create_task(_run_url_job(job, valid_urls, item_ids=request.itemIds))
    return StartJobResponse(jobId=job.id, status=job.status.value)


@app.post("/jobs/extract-url", response_model=StartJobResponse)
async def start_extract_url_job(request: StartExtractUrlRequest) -> StartJobResponse:
    """Start a job that extracts a single product from any URL (no shop/category required)."""
    url = request.url.strip()
    if not url.startswith("http"):
        raise HTTPException(
            status_code=400, detail="URL must start with http:// or https://"
        )

    categories = [
        {"id": c.id, "name": c.name, "slug": c.slug} for c in request.categories
    ]

    # Create job with placeholder shop/category (resolved later by backend)
    job = await job_manager.create_job("_url_import", "_auto", 1)
    asyncio.create_task(
        _run_extract_url_job(job, url, categories, item_ids=request.itemIds)
    )
    return StartJobResponse(jobId=job.id, status=job.status.value)


@app.get("/jobs/{job_id}")
async def get_job(job_id: str) -> dict:
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job.to_dict()


@app.get("/jobs/{job_id}/stream")
async def stream_job(job_id: str) -> EventSourceResponse:
    job = await job_manager.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")

    async def event_generator():
        # Send any existing progress events first (replay)
        for event in list(job.progress):
            yield {
                "event": event.stage,
                "data": json.dumps(
                    {"stage": event.stage, "message": event.message, "data": event.data}
                ),
            }

        # If already done, send final event and stop
        if job.status in (JobStatus.COMPLETED, JobStatus.FAILED):
            yield {
                "event": "done",
                "data": json.dumps({"status": job.status.value}),
            }
            return

        # Subscribe to new events
        queue = job.subscribe()
        try:
            while True:
                event = await queue.get()
                if event is None:
                    # Job completed
                    yield {
                        "event": "done",
                        "data": json.dumps({"status": job.status.value}),
                    }
                    return
                yield {
                    "event": event.stage,
                    "data": json.dumps(
                        {
                            "stage": event.stage,
                            "message": event.message,
                            "data": event.data,
                        }
                    ),
                }
        finally:
            job.unsubscribe(queue)

    return EventSourceResponse(event_generator())
