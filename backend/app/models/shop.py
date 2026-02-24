from sqlmodel import Field, SQLModel


class Shop(SQLModel, table=True):
    __tablename__ = "shops"

    id: str = Field(primary_key=True)
    name: str
    logo_url: str
    affiliate_tag: str | None = Field(default=None)
