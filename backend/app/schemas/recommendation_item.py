from pydantic import BaseModel


class RecommendationItemResponse(BaseModel):
    id: str
    type: str
    zone: str
    icon: str
    nameDe: str
    nameEn: str
    reasonDe: str
    reasonEn: str
    parentId: str | None
    displayOrder: int
    variants: list["RecommendationItemResponse"] | None = None

    @classmethod
    def from_cache_entry(cls, entry: dict) -> "RecommendationItemResponse":
        return cls(
            id=entry["id"],
            type=entry["type"],
            zone=entry["zone"],
            icon=entry["icon"],
            nameDe=entry["name_de"],
            nameEn=entry["name_en"],
            reasonDe=entry["reason_de"],
            reasonEn=entry["reason_en"],
            parentId=entry["parent_id"],
            displayOrder=entry["display_order"],
        )


class RecommendationItemUpdate(BaseModel):
    nameDe: str | None = None
    nameEn: str | None = None
    reasonDe: str | None = None
    reasonEn: str | None = None
    zone: str | None = None
    icon: str | None = None


class PublicItemResponse(BaseModel):
    id: str
    name: str
    type: str
