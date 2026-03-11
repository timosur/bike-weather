"""clear seeded products

Revision ID: a1b2c3d4e5f6
Revises: 817f3672d570
Create Date: 2026-03-10 20:00:00.000000

"""

from typing import Sequence, Union

from alembic import op


# revision identifiers, used by Alembic.
revision: str = "a1b2c3d4e5f6"
down_revision: Union[str, None] = "817f3672d570"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

SEEDED_IDS = [
    "prod-001",
    "prod-002",
    "prod-003",
    "prod-004",
    "prod-005",
    "prod-006",
    "prod-007",
    "prod-008",
    "prod-009",
    "prod-010",
]


def upgrade() -> None:
    op.execute(
        f"DELETE FROM products WHERE id IN ({', '.join(repr(i) for i in SEEDED_IDS)})"
    )


def downgrade() -> None:
    # Seeded products are not restored on downgrade — they were test data.
    pass
