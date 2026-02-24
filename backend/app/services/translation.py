"""Translation service: applies locale-specific translations to DB entities."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content_translation import ContentTranslation

DEFAULT_LOCALE = "de"


async def get_translations(
    session: AsyncSession,
    entity_type: str,
    entity_ids: list[str],
    locale: str,
    fields: list[str],
) -> dict[str, dict[str, str]]:
    """Fetch translations for a set of entities.

    Returns: ``{entity_id: {field_name: translated_value}}``
    """
    if locale == DEFAULT_LOCALE or not entity_ids:
        return {}  # German is stored on the entity itself

    stmt = select(ContentTranslation).where(
        ContentTranslation.entity_type == entity_type,
        ContentTranslation.entity_id.in_(entity_ids),
        ContentTranslation.locale == locale,
        ContentTranslation.field_name.in_(fields),
    )
    result = await session.execute(stmt)
    rows = result.scalars().all()

    translations: dict[str, dict[str, str]] = {}
    for row in rows:
        translations.setdefault(row.entity_id, {})[row.field_name] = row.value
    return translations


def apply_translation(
    entity_dict: dict,
    translations: dict[str, str],
    fields: list[str],
) -> dict:
    """Apply translations to an entity dictionary.

    Only overrides fields that have a translation.
    """
    for field in fields:
        if field in translations:
            entity_dict[field] = translations[field]
    return entity_dict
