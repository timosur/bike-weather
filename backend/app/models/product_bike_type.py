from sqlmodel import Field, SQLModel


class ProductBikeType(SQLModel, table=True):
    __tablename__ = "product_bike_types"

    product_id: str = Field(foreign_key="products.id", primary_key=True)
    bike_type: str = Field(primary_key=True)  # "rennrad" | "gravel" | "mtb" | "city"
