from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class FaqItem(SQLModel, table=True):
    __tablename__ = "faq_items"

    id: str = Field(primary_key=True)
    question: str
    answer: str
    category: str
    display_order: int = Field(default=0)
    is_published: bool = Field(default=True)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
