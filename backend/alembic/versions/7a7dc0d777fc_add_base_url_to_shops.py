"""add base_url to shops

Revision ID: 7a7dc0d777fc
Revises: c222a2b6e5f8
Create Date: 2026-03-14 20:17:01.621797

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = "7a7dc0d777fc"
down_revision: Union[str, None] = "c222a2b6e5f8"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "shops",
        sa.Column("base_url", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
    )

    # Populate base_url for existing shops
    shops_table = sa.table(
        "shops", sa.column("id", sa.String), sa.column("base_url", sa.String)
    )
    op.execute(
        shops_table.update()
        .where(shops_table.c.id == "shop-bike-components")
        .values(base_url="bike-components.de")
    )
    op.execute(
        shops_table.update()
        .where(shops_table.c.id == "shop-amazon")
        .values(base_url="amazon.de")
    )


def downgrade() -> None:
    op.drop_column("shops", "base_url")
