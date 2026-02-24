"""ContentTranslation model: stores per-field translations for DB content."""

from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class ContentTranslation(SQLModel, table=True):
    __tablename__ = "content_translations"

    id: int | None = Field(default=None, primary_key=True)
    entity_type: str = Field(index=True)  # "product", "faq_item", "about_content", etc.
    entity_id: str = Field(index=True)  # ID of the entity being translated
    locale: str = Field(index=True)  # "en" (German stored on entity itself)
    field_name: str  # "name", "question", "answer", "title", "body", etc.
    value: str  # The translated text
    updated_at: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None)
    )
