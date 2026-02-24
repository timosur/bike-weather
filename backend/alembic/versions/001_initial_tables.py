"""initial tables

Revision ID: 001
Revises:
Create Date: 2026-02-24

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel

# revision identifiers, used by Alembic.
revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("external_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("email", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("is_admin", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_external_id"), "users", ["external_id"], unique=True)
    op.create_index(op.f("ix_users_email"), "users", ["email"], unique=True)

    op.create_table(
        "shops",
        sa.Column("id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("logo_url", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("affiliate_tag", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "product_categories",
        sa.Column("id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("slug", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("description", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("icon", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_product_categories_slug"), "product_categories", ["slug"], unique=True)

    op.create_table(
        "products",
        sa.Column("id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("category_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("image_url", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("price", sa.Float(), nullable=False),
        sa.Column("currency", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("shop_id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("affiliate_url", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("matches_zone", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("matches_label", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("weather_temp_min", sa.Float(), nullable=True),
        sa.Column("weather_temp_max", sa.Float(), nullable=True),
        sa.Column("weather_precipitation", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("weather_wind", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("weather_summary", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("is_published", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["product_categories.id"]),
        sa.ForeignKeyConstraint(["shop_id"], ["shops.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_products_category_id"), "products", ["category_id"])
    op.create_index(op.f("ix_products_shop_id"), "products", ["shop_id"])

    op.create_table(
        "affiliate_disclosures",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("badge_label", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("disclaimer_text", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "saved_routes",
        sa.Column("id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("start_location", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("total_distance", sa.Float(), nullable=False),
        sa.Column("distance_unit", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("riding_style", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("last_condition", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("last_used", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_saved_routes_user_id"), "saved_routes", ["user_id"])

    op.create_table(
        "contact_messages",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("category", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("name", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("email", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("message", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "faq_items",
        sa.Column("id", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("question", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("answer", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("category", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("is_published", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "about_content",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("section_key", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("title", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("body", sqlmodel.sql.sqltypes.AutoString(), nullable=False),
        sa.Column("image_url", sqlmodel.sql.sqltypes.AutoString(), nullable=True),
        sa.Column("display_order", sa.Integer(), nullable=False),
        sa.Column("is_published", sa.Boolean(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_about_content_section_key"), "about_content", ["section_key"], unique=True)


def downgrade() -> None:
    op.drop_table("about_content")
    op.drop_table("faq_items")
    op.drop_table("contact_messages")
    op.drop_table("saved_routes")
    op.drop_table("affiliate_disclosures")
    op.drop_table("products")
    op.drop_table("product_categories")
    op.drop_table("shops")
    op.drop_table("users")
