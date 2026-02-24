from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class AboutContent(SQLModel, table=True):
    __tablename__ = "about_content"

    id: int | None = Field(default=None, primary_key=True)
    section_key: str = Field(unique=True, index=True)
    title: str
    body: str
    image_url: str | None = Field(default=None)
    display_order: int = Field(default=0)
    is_published: bool = Field(default=True)
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
