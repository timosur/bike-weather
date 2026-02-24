from datetime import datetime

from pydantic import BaseModel


class FaqItemResponse(BaseModel):
    id: str
    question: str
    answer: str
    category: str


# --- Admin schemas ---


class FaqItemCreate(BaseModel):
    id: str
    question: str
    answer: str
    category: str
    displayOrder: int = 0
    isPublished: bool = True


class FaqItemUpdate(BaseModel):
    question: str | None = None
    answer: str | None = None
    category: str | None = None
    displayOrder: int | None = None
    isPublished: bool | None = None


class FaqItemAdminResponse(BaseModel):
    id: str
    question: str
    answer: str
    category: str
    displayOrder: int
    isPublished: bool
    createdAt: datetime
    updatedAt: datetime

    @classmethod
    def from_model(cls, obj: object) -> "FaqItemAdminResponse":
        return cls(
            id=getattr(obj, "id"),
            question=getattr(obj, "question"),
            answer=getattr(obj, "answer"),
            category=getattr(obj, "category"),
            displayOrder=getattr(obj, "display_order"),
            isPublished=getattr(obj, "is_published"),
            createdAt=getattr(obj, "created_at"),
            updatedAt=getattr(obj, "updated_at"),
        )


class FaqReorderItem(BaseModel):
    id: str
    displayOrder: int
