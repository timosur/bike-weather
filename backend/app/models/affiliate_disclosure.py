from sqlmodel import Field, SQLModel


class AffiliateDisclosure(SQLModel, table=True):
    __tablename__ = "affiliate_disclosures"

    id: int | None = Field(default=None, primary_key=True)
    badge_label: str
    disclaimer_text: str
    is_active: bool = Field(default=True)
