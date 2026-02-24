"""content translations table

Revision ID: 002
Revises: 001
Create Date: 2026-02-24

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "content_translations",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("entity_type", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("entity_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("locale", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("field_name", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("value", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_content_translations_entity_type"),
        "content_translations",
        ["entity_type"],
    )
    op.create_index(
        op.f("ix_content_translations_entity_id"),
        "content_translations",
        ["entity_id"],
    )
    op.create_index(
        op.f("ix_content_translations_locale"),
        "content_translations",
        ["locale"],
    )
    op.create_index(
        "uq_content_translations_entity_field",
        "content_translations",
        ["entity_type", "entity_id", "locale", "field_name"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index("uq_content_translations_entity_field", table_name="content_translations")
    op.drop_index(op.f("ix_content_translations_locale"), table_name="content_translations")
    op.drop_index(op.f("ix_content_translations_entity_id"), table_name="content_translations")
    op.drop_index(op.f("ix_content_translations_entity_type"), table_name="content_translations")
    op.drop_table("content_translations")
