"""add ride_input to saved_routes

Revision ID: 004
Revises: 003
Create Date: 2026-02-26

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

# revision identifiers, used by Alembic.
revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("saved_routes", sa.Column("ride_input", JSONB, nullable=True))


def downgrade() -> None:
    op.drop_column("saved_routes", "ride_input")
