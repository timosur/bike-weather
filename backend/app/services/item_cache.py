"""In-memory cache for RecommendationItem translations.

Loaded once on startup from DB, provides synchronous lookups
for the rule engine (clothing_rules.py, equipment_rules.py).
Refreshed when an admin edits an item.
"""

import logging
from typing import TypedDict

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.recommendation_item import RecommendationItem

logger = logging.getLogger(__name__)


class ItemTranslation(TypedDict):
    name: str
    reason: str


class ItemCacheEntry(TypedDict):
    id: str
    type: str
    zone: str
    icon: str
    name_de: str
    name_en: str
    reason_de: str
    reason_en: str
    parent_id: str | None
    display_order: int


class ItemCache:
    """In-memory cache of all RecommendationItem rows."""

    def __init__(self) -> None:
        self._items: dict[str, ItemCacheEntry] = {}

    async def load(self, session: AsyncSession) -> None:
        """Load all items from the database into memory."""
        result = await session.execute(select(RecommendationItem))
        items = result.scalars().all()
        self._items = {}
        for item in items:
            self._items[item.id] = ItemCacheEntry(
                id=item.id,
                type=item.type,
                zone=item.zone,
                icon=item.icon,
                name_de=item.name_de,
                name_en=item.name_en,
                reason_de=item.reason_de,
                reason_en=item.reason_en,
                parent_id=item.parent_id,
                display_order=item.display_order,
            )
        logger.info("Loaded %d recommendation items into cache", len(self._items))

    async def refresh(self, session: AsyncSession) -> None:
        """Reload the cache from DB (e.g. after admin edit)."""
        await self.load(session)

    def get_clothing_translation(
        self, item_id: str, locale: str
    ) -> ItemTranslation | None:
        """Get clothing item translation. Returns None if not found."""
        entry = self._items.get(item_id)
        if not entry or entry["type"] != "clothing":
            return None
        return ItemTranslation(
            name=entry[f"name_{locale}"]
            if f"name_{locale}" in entry
            else entry["name_en"],
            reason=entry[f"reason_{locale}"]
            if f"reason_{locale}" in entry
            else entry["reason_en"],
        )

    def get_equipment_translation(
        self, item_id: str, locale: str
    ) -> ItemTranslation | None:
        """Get equipment item translation. Returns None if not found."""
        entry = self._items.get(item_id)
        if not entry or entry["type"] != "equipment":
            return None
        return ItemTranslation(
            name=entry[f"name_{locale}"]
            if f"name_{locale}" in entry
            else entry["name_en"],
            reason=entry[f"reason_{locale}"]
            if f"reason_{locale}" in entry
            else entry["reason_en"],
        )

    def get_all_items(self) -> list[ItemCacheEntry]:
        """Return all cached items."""
        return list(self._items.values())

    def get_items_for_agent(self) -> list[dict[str, str]]:
        """Return item list for agent consumption: [{id, name, type}]."""
        return [
            {"id": entry["id"], "name": entry["name_en"], "type": entry["type"]}
            for entry in self._items.values()
        ]


# Global singleton
item_cache = ItemCache()
