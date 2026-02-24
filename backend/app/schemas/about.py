from datetime import datetime

from pydantic import BaseModel


class AboutContentResponse(BaseModel):
    section_key: str
    title: str
    body: str
    image_url: str | None


# --- Admin schemas ---


class AboutContentCreate(BaseModel):
    sectionKey: str
    title: str
    body: str
    imageUrl: str | None = None
    displayOrder: int = 0
    isPublished: bool = True


class AboutContentUpdate(BaseModel):
    sectionKey: str | None = None
    title: str | None = None
    body: str | None = None
    imageUrl: str | None = None
    displayOrder: int | None = None
    isPublished: bool | None = None


class AboutContentAdminResponse(BaseModel):
    id: int
    sectionKey: str
    title: str
    body: str
    imageUrl: str | None
    displayOrder: int
    isPublished: bool
    updatedAt: datetime

    @classmethod
    def from_model(cls, obj: object) -> "AboutContentAdminResponse":
        return cls(
            id=getattr(obj, "id"),
            sectionKey=getattr(obj, "section_key"),
            title=getattr(obj, "title"),
            body=getattr(obj, "body"),
            imageUrl=getattr(obj, "image_url"),
            displayOrder=getattr(obj, "display_order"),
            isPublished=getattr(obj, "is_published"),
            updatedAt=getattr(obj, "updated_at"),
        )
