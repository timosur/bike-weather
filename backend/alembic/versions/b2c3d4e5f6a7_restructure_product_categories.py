"""restructure product categories

Revision ID: b2c3d4e5f6a7
Revises: a1b2c3d4e5f6
Create Date: 2026-03-11 10:00:00.000000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "b2c3d4e5f6a7"
down_revision: Union[str, None] = "a1b2c3d4e5f6"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

# New categories to insert
NEW_CATEGORIES = [
    ("cat-rain-jackets", "Regenjacken", "rain-jackets", "rain-jacket", 0),
    ("cat-wind-jackets", "Wind- & Softshelljacken", "wind-jackets", "jacket", 1),
    ("cat-thermal-jackets", "Thermojacken", "thermal-jackets", "jacket", 2),
    ("cat-jerseys", "Radtrikots", "jerseys", "jersey", 3),
    ("cat-base-layers", "Baselayer & Unterwäsche", "base-layers", "base-layer", 4),
    ("cat-vests", "Radwesten", "vests", "vest", 5),
    ("cat-thermal-tights", "Thermo-Radhosen", "thermal-tights", "pants-long", 6),
    ("cat-cycling-shorts", "Radshorts & Radhosen", "cycling-shorts", "pants-short", 7),
    ("cat-rain-pants", "Regenhosen", "rain-pants", "overpants", 8),
    ("cat-winter-gloves", "Winterhandschuhe", "winter-gloves", "gloves-waterproof", 9),
    ("cat-summer-gloves", "Sommerhandschuhe", "summer-gloves", "gloves-light", 10),
    ("cat-shoe-covers", "Überschuhe", "shoe-covers", "shoe-covers", 12),
    ("cat-cycling-shoes", "Radschuhe", "cycling-shoes", "shoes", 13),
    ("cat-eyewear", "Radbrillen", "eyewear", "eyewear", 14),
    ("cat-neck-face", "Hals- & Gesichtsschutz", "neck-face", "neck-gaiter", 15),
]

# Old categories that will be replaced (headwear, lights, accessories kept)
OLD_TO_REMOVE = ["cat-jackets", "cat-gloves", "cat-pants", "cat-shoes"]

# Reassignment rules: old_category_id -> SQL CASE logic
# Products from old categories get reassigned based on weather attributes
REASSIGN_SQL = """
UPDATE products SET category_id = CASE
    WHEN category_id = 'cat-jackets' THEN
        CASE
            WHEN weather_precipitation IN ('heavy-rain', 'light-rain') THEN 'cat-rain-jackets'
            WHEN weather_wind = 'strong-wind' THEN 'cat-wind-jackets'
            WHEN weather_temp_max IS NOT NULL AND weather_temp_max < 10 THEN 'cat-thermal-jackets'
            ELSE 'cat-rain-jackets'
        END
    WHEN category_id = 'cat-gloves' THEN
        CASE
            WHEN weather_temp_max IS NOT NULL AND weather_temp_max < 10 THEN 'cat-winter-gloves'
            ELSE 'cat-summer-gloves'
        END
    WHEN category_id = 'cat-pants' THEN
        CASE
            WHEN weather_precipitation IN ('heavy-rain', 'light-rain') THEN 'cat-rain-pants'
            WHEN weather_temp_max IS NOT NULL AND weather_temp_max < 15 THEN 'cat-thermal-tights'
            ELSE 'cat-cycling-shorts'
        END
    WHEN category_id = 'cat-shoes' THEN
        CASE
            WHEN weather_precipitation IN ('heavy-rain', 'light-rain') THEN 'cat-shoe-covers'
            ELSE 'cat-cycling-shoes'
        END
    ELSE category_id
END
WHERE category_id IN ('cat-jackets', 'cat-gloves', 'cat-pants', 'cat-shoes');
"""

# Update existing categories that are kept but need new display_order
UPDATE_KEPT = [
    ("cat-headwear", "Kopfbedeckung", "headwear", "headwear", 11),
    ("cat-lights", "Fahrradlichter", "bike-lights", "light", 16),
    ("cat-accessories", "Zubehör & Ausrüstung", "accessories-gear", "accessories", 17),
]


def upgrade() -> None:
    # 1. Insert new categories
    for cat_id, name, slug, icon, order in NEW_CATEGORIES:
        op.execute(
            sa.text(
                "INSERT INTO product_categories (id, name, slug, description, icon, display_order) "
                "VALUES (:id, :name, :slug, '', :icon, :display_order) "
                "ON CONFLICT (id) DO UPDATE SET name = :name, slug = :slug, icon = :icon, display_order = :display_order"
            ).bindparams(id=cat_id, name=name, slug=slug, icon=icon, display_order=order)
        )

    # 2. Reassign products from old categories to new ones
    op.execute(sa.text(REASSIGN_SQL))

    # 3. Update kept categories with new display_order
    for cat_id, name, slug, icon, order in UPDATE_KEPT:
        op.execute(
            sa.text(
                "UPDATE product_categories SET name = :name, slug = :slug, icon = :icon, display_order = :display_order "
                "WHERE id = :id"
            ).bindparams(id=cat_id, name=name, slug=slug, icon=icon, display_order=order)
        )

    # 4. Remove old categories (products already reassigned)
    for old_id in OLD_TO_REMOVE:
        op.execute(
            sa.text("DELETE FROM product_categories WHERE id = :id").bindparams(id=old_id)
        )


def downgrade() -> None:
    # Re-create old categories
    old_categories = [
        ("cat-jackets", "Fahrradjacken", "cycling-jackets", "jacket", 0),
        ("cat-gloves", "Radhandschuhe", "cycling-gloves", "gloves", 1),
        ("cat-pants", "Radhosen", "cycling-tights", "pants", 2),
        ("cat-shoes", "Radschuhe & Überschuhe", "cycling-shoes-overshoes", "shoes", 4),
    ]
    for cat_id, name, slug, icon, order in old_categories:
        op.execute(
            sa.text(
                "INSERT INTO product_categories (id, name, slug, description, icon, display_order) "
                "VALUES (:id, :name, :slug, '', :icon, :display_order) "
                "ON CONFLICT (id) DO NOTHING"
            ).bindparams(id=cat_id, name=name, slug=slug, icon=icon, display_order=order)
        )

    # Move products back to generic categories
    reassign_back = {
        "cat-rain-jackets": "cat-jackets",
        "cat-wind-jackets": "cat-jackets",
        "cat-thermal-jackets": "cat-jackets",
        "cat-winter-gloves": "cat-gloves",
        "cat-summer-gloves": "cat-gloves",
        "cat-thermal-tights": "cat-pants",
        "cat-cycling-shorts": "cat-pants",
        "cat-rain-pants": "cat-pants",
        "cat-shoe-covers": "cat-shoes",
        "cat-cycling-shoes": "cat-shoes",
    }
    for new_id, old_id in reassign_back.items():
        op.execute(
            sa.text(
                "UPDATE products SET category_id = :old_id WHERE category_id = :new_id"
            ).bindparams(old_id=old_id, new_id=new_id)
        )

    # Restore kept categories display_order
    restore_kept = [
        ("cat-headwear", "Kopfbedeckung", "headwear", "headwear", 3),
        ("cat-lights", "Fahrradlichter", "bike-lights", "light", 5),
        ("cat-accessories", "Zubehör & Ausrüstung", "accessories-gear", "accessories", 6),
    ]
    for cat_id, name, slug, icon, order in restore_kept:
        op.execute(
            sa.text(
                "UPDATE product_categories SET name = :name, slug = :slug, icon = :icon, display_order = :display_order "
                "WHERE id = :id"
            ).bindparams(id=cat_id, name=name, slug=slug, icon=icon, display_order=order)
        )

    # Remove new categories
    for cat_id, _, _, _, _ in NEW_CATEGORIES:
        op.execute(
            sa.text("DELETE FROM product_categories WHERE id = :id").bindparams(id=cat_id)
        )
