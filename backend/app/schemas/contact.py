from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


ContactCategory = Literal["feedback", "bug", "feature", "sonstiges"]


class ContactFormSchema(BaseModel):
    category: ContactCategory
    name: str = Field(min_length=1, max_length=200)
    email: EmailStr
    message: str = Field(min_length=1, max_length=5000)


# --- Admin schemas ---


class ContactMessageResponse(BaseModel):
    id: int
    category: str
    name: str
    email: str
    message: str
    createdAt: datetime

    @classmethod
    def from_model(cls, obj: object) -> "ContactMessageResponse":
        return cls(
            id=getattr(obj, "id"),
            category=getattr(obj, "category"),
            name=getattr(obj, "name"),
            email=getattr(obj, "email"),
            message=getattr(obj, "message"),
            createdAt=getattr(obj, "created_at"),
        )
