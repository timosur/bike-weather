"""Public items endpoint for agent consumption."""

from fastapi import APIRouter

from app.schemas.recommendation_item import PublicItemResponse
from app.services.item_cache import item_cache

router = APIRouter(tags=["items"])


@router.get("/items", response_model=list[PublicItemResponse])
async def list_public_items() -> list[PublicItemResponse]:
    """Return all item IDs with English names for agent LLM prompts."""
    return [
        PublicItemResponse(id=i["id"], name=i["name"], type=i["type"])
        for i in item_cache.get_items_for_agent()
    ]
