"""remove price and currency from products

Revision ID: 817f3672d570
Revises: 976ee2c2fb32
Create Date: 2026-03-10 18:43:00.156437

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel


# revision identifiers, used by Alembic.
revision: str = "817f3672d570"
down_revision: Union[str, None] = "976ee2c2fb32"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.drop_column("products", "price")
    op.drop_column("products", "currency")


def downgrade() -> None:
    op.add_column(
        "products",
        sa.Column(
            "currency",
            sa.VARCHAR(),
            autoincrement=False,
            nullable=False,
            server_default="EUR",
        ),
    )
    op.add_column(
        "products",
        sa.Column(
            "price",
            sa.DOUBLE_PRECISION(precision=53),
            autoincrement=False,
            nullable=False,
            server_default="0",
        ),
    )
