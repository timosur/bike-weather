"""Admin routes for managing recommendation items."""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import require_admin
from app.database import get_session
from app.models.recommendation_item import RecommendationItem
from app.models.user import User
from app.schemas.recommendation_item import (
    RecommendationItemResponse,
    RecommendationItemUpdate,
)
from app.services.item_cache import item_cache

router = APIRouter()


@router.get("/items", response_model=list[RecommendationItemResponse])
async def list_items(
    type: str | None = Query(None, pattern="^(clothing|equipment)$"),
    zone: str | None = None,
    _admin: User = Depends(require_admin),
) -> list[RecommendationItemResponse]:
    """List all recommendation items with optional filtering, grouped by parent-variant."""
    all_entries = item_cache.get_all_items()

    # Filter
    if type:
        all_entries = [e for e in all_entries if e["type"] == type]
    if zone:
        all_entries = [e for e in all_entries if e["zone"] == zone]

    # Separate generics and variants
    generics = [e for e in all_entries if e["parent_id"] is None]
    variants = [e for e in all_entries if e["parent_id"] is not None]

    # Group variants under parents
    variant_map: dict[str, list[RecommendationItemResponse]] = {}
    for v in variants:
        parent_id = v["parent_id"]
        if parent_id not in variant_map:
            variant_map[parent_id] = []
        variant_map[parent_id].append(RecommendationItemResponse.from_cache_entry(v))

    # Sort variants by display_order
    for children in variant_map.values():
        children.sort(key=lambda x: x.displayOrder)

    # Build response
    result = []
    for g in sorted(generics, key=lambda e: e["display_order"]):
        item = RecommendationItemResponse.from_cache_entry(g)
        item.variants = variant_map.get(g["id"])
        result.append(item)

    return result


@router.get("/items/{item_id}", response_model=RecommendationItemResponse)
async def get_item(
    item_id: str,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> RecommendationItemResponse:
    """Get a single recommendation item by ID."""
    result = await session.execute(
        select(RecommendationItem).where(RecommendationItem.id == item_id)
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    entry = {
        "id": item.id,
        "type": item.type,
        "zone": item.zone,
        "icon": item.icon,
        "name_de": item.name_de,
        "name_en": item.name_en,
        "reason_de": item.reason_de,
        "reason_en": item.reason_en,
        "parent_id": item.parent_id,
        "display_order": item.display_order,
    }
    return RecommendationItemResponse.from_cache_entry(entry)


@router.put("/items/{item_id}", response_model=RecommendationItemResponse)
async def update_item(
    item_id: str,
    data: RecommendationItemUpdate,
    _admin: User = Depends(require_admin),
    session: AsyncSession = Depends(get_session),
) -> RecommendationItemResponse:
    """Update a recommendation item's metadata."""
    result = await session.execute(
        select(RecommendationItem).where(RecommendationItem.id == item_id)
    )
    item = result.scalars().first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")

    field_map = {
        "nameDe": "name_de",
        "nameEn": "name_en",
        "reasonDe": "reason_de",
        "reasonEn": "reason_en",
        "zone": "zone",
        "icon": "icon",
    }
    update_data = data.model_dump(exclude_unset=True)
    for camel, snake in field_map.items():
        if camel in update_data:
            setattr(item, snake, update_data[camel])

    await session.commit()
    await session.refresh(item)

    # Invalidate cache
    await item_cache.refresh(session)

    entry = {
        "id": item.id,
        "type": item.type,
        "zone": item.zone,
        "icon": item.icon,
        "name_de": item.name_de,
        "name_en": item.name_en,
        "reason_de": item.reason_de,
        "reason_en": item.reason_en,
        "parent_id": item.parent_id,
        "display_order": item.display_order,
    }
    return RecommendationItemResponse.from_cache_entry(entry)
