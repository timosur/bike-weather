"""add share_token to saved_routes

Revision ID: 003
Revises: 002
Create Date: 2026-02-26

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "003"
down_revision: Union[str, None] = "002"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("saved_routes", sa.Column("share_token", sa.String(), nullable=True))
    op.create_unique_constraint(
        "uq_saved_routes_share_token", "saved_routes", ["share_token"]
    )
    op.create_index("ix_saved_routes_share_token", "saved_routes", ["share_token"])


def downgrade() -> None:
    op.drop_index("ix_saved_routes_share_token", table_name="saved_routes")
    op.drop_constraint("uq_saved_routes_share_token", "saved_routes", type_="unique")
    op.drop_column("saved_routes", "share_token")
