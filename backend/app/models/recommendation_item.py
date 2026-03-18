from sqlmodel import Field, SQLModel


class RecommendationItem(SQLModel, table=True):
    __tablename__ = "recommendation_items"

    id: str = Field(primary_key=True)
    type: str = Field(index=True)  # "clothing" or "equipment"
    zone: str = Field(
        default=""
    )  # body zone: head, eyes, neck, upperBody, lowerBody, hands, feet, or ""
    icon: str = Field(default="")
    name_de: str = Field(default="")
    name_en: str = Field(default="")
    reason_de: str = Field(default="")
    reason_en: str = Field(default="")
    parent_id: str | None = Field(
        default=None, foreign_key="recommendation_items.id", index=True
    )
    display_order: int = Field(default=0)
