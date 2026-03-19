# BIKE-26: Item IDs in Database with Admin Management

| Field            | Value                                 |
| ---------------- | ------------------------------------- |
| **ID**           | BIKE-26                               |
| **Status**       | Done                                  |
| **Created**      | 2026-03-18                            |
| **Dependencies** | BIKE-24 (Item-Level Product Matching) |

## Description

Move the hardcoded clothing/equipment item IDs (`cl-*`, `eq-*`) from code into the database as a first-class entity. Currently, item definitions are duplicated across three places: `backend/app/rules/translations.py` (canonical translations), `agent/extractor.py` (LLM prompt context), and `backend/app/api/routes/admin/products.py` (zone mapping). This creates maintenance burden and risks drift between services.

A new `RecommendationItem` database model will store each item's ID, type (clothing/equipment), body zone, icon, localized names, and localized reason templates. Items are seeded on startup from the existing hardcoded data and managed (edit only, no create/delete) through the admin panel. The rule engine continues to own the logic for *which* items to recommend under *which* weather conditions — only the item metadata moves to the DB.

Bike-type variants (e.g. `cl-shorts-rennrad`, `cl-shorts-gravel`) are modeled as children of their generic parent item (e.g. `cl-shorts`), enabling structured grouping in the admin UI.

The agent service (no direct DB access) fetches the current item list from a new backend API endpoint before running LLM extraction, eliminating the duplicated `VALID_ITEM_IDS` dict.

## Scope

### In Scope

- **New DB model** — `RecommendationItem` table storing item metadata with translations
- **Parent-variant relationship** — generic items can have bike-type variant children
- **Seed migration** — populate the table from existing `CLOTHING_TRANSLATIONS`, `EQUIPMENT_TRANSLATIONS`, and `_ITEM_ZONE` data
- **Admin UI** — list, view, and edit item metadata (names, reasons, zone, icon) in the existing admin panel
- **Public/internal API endpoint** — return item ID list with English names for agent consumption
- **Refactor backend** — rule engine and product matching read item metadata from DB instead of hardcoded dicts
- **Refactor agent** — agent fetches item list from backend API instead of using `VALID_ITEM_IDS` constant

### Out of Scope

- Creating or deleting items from the admin panel (items are seeded, code changes needed for new items)
- Moving rule engine logic (temperature thresholds, weather conditions) to the DB
- Changing the recommendation algorithm
- Search-based product import (BIKE-16)

## User Stories

- **US-1:** As an admin, I want to view all clothing and equipment items in the admin panel, so that I can see what items the system recommends.
- **US-2:** As an admin, I want to edit an item's display name and reason text (in both DE and EN), so that I can improve wording without a code deploy.
- **US-3:** As an admin, I want to edit an item's body zone and icon, so that I can correct categorization or visual display.
- **US-4:** As an admin, I want to see bike-type variants grouped under their parent item, so that I can understand the relationship between generic and specialized items.
- **US-5:** As the agent service, I want to fetch the current item ID list from the backend API, so that LLM prompts always use the up-to-date set of valid items.
- **US-6:** As a developer, I want a single source of truth for item metadata in the database, so that I don't need to keep three separate hardcoded dictionaries in sync.

## Acceptance Criteria

- [ ] AC-1: A `RecommendationItem` model exists in the DB with fields: `id` (string PK, e.g. `cl-rain-jacket`), `type` (clothing | equipment), `zone` (body zone string), `icon` (string), `name_de`, `name_en`, `reason_de`, `reason_en`, `parent_id` (nullable FK to self for variants), `display_order` (integer).
- [ ] AC-2: An Alembic migration seeds all existing items from `CLOTHING_TRANSLATIONS`, `EQUIPMENT_TRANSLATIONS`, and `_ITEM_ZONE` into the new table.
- [ ] AC-3: Bike-type variants (IDs ending in `-rennrad`, `-gravel`, `-mtb`, `-city`) have their `parent_id` set to the corresponding generic item ID.
- [ ] AC-4: The admin panel has an "Items" section listing all items, filterable by type (clothing/equipment) and zone.
- [ ] AC-5: Clicking an item in the admin list opens an edit form where the admin can modify: `name_de`, `name_en`, `reason_de`, `reason_en`, `zone`, `icon`.
- [ ] AC-6: Variants are displayed grouped under their parent item in the admin list.
- [ ] AC-7: The rule engine (`clothing_rules.py`, `equipment_rules.py`) reads item names and reason templates from the DB instead of `CLOTHING_TRANSLATIONS` / `EQUIPMENT_TRANSLATIONS`.
- [ ] AC-8: The `GET /clothing-items` admin endpoint reads from the DB instead of iterating hardcoded dicts.
- [ ] AC-9: A new `GET /api/items` endpoint (no auth required, or internal-only) returns all item IDs with English names, suitable for the agent's LLM prompt.
- [ ] AC-10: The agent fetches item IDs from the backend API at extraction time. The hardcoded `VALID_ITEM_IDS` dict in `agent/extractor.py` is removed.
- [ ] AC-11: `Product.matches_item_id` remains a string FK-like reference to `RecommendationItem.id`. Existing product data is not affected.
- [ ] AC-12: Existing ride report generation produces identical output after the migration (translations are preserved).
- [ ] AC-13: The seed script is idempotent — running it multiple times does not create duplicate items.

## Edge Cases

- **EC-1: Missing translation** — If an item's `reason_de` or `reason_en` is empty in the DB, the rule engine should fall back to an empty string (same as current behavior when a translation key is missing).
- **EC-2: Orphaned variants** — If a generic parent item is somehow missing, variant items should still function independently (graceful degradation).
- **EC-3: Agent API unavailable** — If the agent cannot reach the backend API for item IDs, it should fall back to a cached/bundled list or fail the extraction job with a clear error.
- **EC-4: Concurrent edits** — Two admins editing the same item simultaneously should not corrupt data (standard DB-level last-write-wins is acceptable).
- **EC-5: Reason template placeholders** — Reason strings contain `{temp_min:.0f}`, `{feels:.0f}`, etc. The admin edit form should display these as-is and not strip them. A note in the UI should explain the placeholder syntax.
- **EC-6: Product references** — If an item's ID were to change (not supported in this spec), existing `Product.matches_item_id` references would break. IDs are immutable by design — only metadata is editable.

---

<!-- Appended by /architecture agent -->

## Tech Design

### Service Impact Map

```
Backend:  New model + migration + seed + 3 API endpoints + rules refactor + service
Frontend: New admin page + API module + nav entry + i18n keys
Agent:    Fetch item list from backend API (remove hardcoded dict)
Database: 1 new table (recommendation_items), 1 seed migration
```

### A) Data Model — `RecommendationItem`

New table `recommendation_items` with self-referential parent-variant relationship:

| Field           | Type             | Description                                                                                          |
| --------------- | ---------------- | ---------------------------------------------------------------------------------------------------- |
| `id`            | str (PK)         | Item ID, e.g. `cl-rain-jacket`                                                                       |
| `type`          | str              | `clothing` or `equipment`                                                                            |
| `zone`          | str              | Body zone: `head`, `eyes`, `neck`, `upperBody`, `lowerBody`, `hands`, `feet`, or empty for equipment |
| `icon`          | str              | Icon identifier used by the rule engine                                                              |
| `name_de`       | str              | German display name                                                                                  |
| `name_en`       | str              | English display name                                                                                 |
| `reason_de`     | str              | German reason template (f-string with placeholders like `{temp_min:.0f}`)                            |
| `reason_en`     | str              | English reason template                                                                              |
| `parent_id`     | str? (FK → self) | Parent item ID for bike-type variants, null for generic items                                        |
| `display_order` | int              | Sort order within zone/type for admin display                                                        |

**Parent-variant structure:**
- Generic items (e.g. `cl-shorts`) have `parent_id = null`
- Bike-type variants (e.g. `cl-shorts-rennrad`) have `parent_id = "cl-shorts"`
- Detected by suffix: `-rennrad`, `-gravel`, `-mtb`, `-city`
- Equipment items have no variants

### B) API Design

```
GET  /api/items                    — public, returns all items (agent consumption + admin list)
GET  /api/admin/items              — admin, returns items with full metadata for admin UI
GET  /api/admin/items/{id}         — admin, single item detail
PUT  /api/admin/items/{id}         — admin, update item metadata
```

The existing `GET /api/admin/products/clothing-items` endpoint will be refactored to read from the DB, or deprecated in favor of the new `GET /api/items` endpoint.

### C) Rule Engine Refactor Strategy

**Key decision: Caching layer instead of async refactor.**

The rule engine functions (`get_clothing_items`, `get_equipment_items`) are synchronous and called deep in the report-building pipeline. Converting them to async would require a large cascade of changes.

Instead, a **translation cache service** will:
1. Load all `RecommendationItem` rows into memory on startup
2. Expose synchronous lookup functions (`get_clothing_translation`, `get_equipment_translation`) with the same signature as today
3. Refresh the cache when an admin edits an item (cache invalidation on write)
4. The rule engine code (`clothing_rules.py`, `equipment_rules.py`) will call the cache service instead of the hardcoded dicts — minimal code changes

This approach:
- Keeps rule engine synchronous (no cascade changes)
- One DB query on startup, zero during report generation (performance-neutral)
- Cache invalidation is simple (single process, in-memory dict)

### D) Component Structure (Admin UI)

```
Admin Navigation
└── "Items" nav entry (new)

AdminItemsPage
├── FilterBar (type: clothing | equipment, zone dropdown)
├── ItemGroupList
│   └── ItemGroup (one per generic item)
│       ├── GenericItemRow (click → edit drawer/modal)
│       └── VariantRows (indented children)
│           └── VariantItemRow (click → edit drawer/modal)
└── ItemEditDrawer / ItemEditModal
    ├── ID (read-only)
    ├── Type (read-only)
    ├── Zone (select)
    ├── Icon (text input)
    ├── Name DE / Name EN (text inputs)
    ├── Reason DE / Reason EN (textareas)
    ├── Placeholder help text (explains {temp_min:.0f} syntax)
    └── Save / Cancel buttons
```

### E) Agent Integration

The agent currently has no backend URL in its config. Since the backend **calls the agent** (not vice versa), the simplest approach:

- Add a new backend endpoint `GET /api/items` (public, no auth) that returns `[{id, name}]`
- The agent's extraction functions accept the item list as a parameter
- When the backend starts an extraction job (via agent proxy), it includes the current item list in the job request payload

This avoids the agent needing to know the backend URL. The backend already sends job requests to the agent — it can include the item list in the payload.

### F) Seed Strategy

A new `_seed_recommendation_items()` function in `seed.py` will:
1. Iterate `CLOTHING_TRANSLATIONS` and `EQUIPMENT_TRANSLATIONS` to extract all unique item IDs
2. For each item, build a `RecommendationItem` with translations from both DE and EN entries
3. Detect parent-variant relationships from ID suffix patterns
4. Map zones from the existing `_ITEM_ZONE` dict
5. Icons from `BIKE_CLOTHING_OVERRIDES` or a default mapping
6. Upsert (get existing → update, or add new) — idempotent

After the seed is verified working, the hardcoded dicts (`CLOTHING_TRANSLATIONS`, `EQUIPMENT_TRANSLATIONS`, `_ITEM_ZONE`) become dead code and are removed.

### G) Dependencies

No new packages needed — this uses existing SQLModel, Alembic, FastAPI patterns. Frontend uses existing React, Tailwind, and i18n patterns.

## Implementation Plan

_See `project/plans/BIKE-26-plan.md` (created by the /architecture agent)._

<!-- Appended by /qa agent -->
