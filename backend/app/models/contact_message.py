from datetime import datetime, timezone

from sqlmodel import Field, SQLModel


class ContactMessage(SQLModel, table=True):
    __tablename__ = "contact_messages"

    id: int | None = Field(default=None, primary_key=True)
    category: str
    name: str
    email: str
    message: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
