from sqlmodel import Field, SQLModel


class ProductCategory(SQLModel, table=True):
    __tablename__ = "product_categories"

    id: str = Field(primary_key=True)
    name: str
    slug: str = Field(unique=True, index=True)
    description: str = Field(default="")
    icon: str
    display_order: int = Field(default=0)
