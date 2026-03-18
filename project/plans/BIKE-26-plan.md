# Plan: BIKE-26 — Item IDs in Database with Admin Management

> Status: In Progress
> Feature spec: [BIKE-26](../features/BIKE-26-item-ids-database.md)
> Created: 2026-03-18

## Phase 1: Backend — Data Model & Seed

**Owner: Backend Developer**

- [x] Create `backend/app/models/recommendation_item.py` — `RecommendationItem` SQLModel with fields: `id` (str PK), `type` (str), `zone` (str), `icon` (str), `name_de`, `name_en`, `reason_de`, `reason_en`, `parent_id` (nullable FK to self), `display_order` (int)
- [x] Export the new model in `backend/app/models/__init__.py`
- [x] Run `alembic revision --autogenerate -m "add recommendation_items table"` to create the migration
- [x] Apply migration with `alembic upgrade head` and verify table exists
- [x] Add `_seed_recommendation_items()` to `backend/app/seed.py` that reads from existing `CLOTHING_TRANSLATIONS`, `EQUIPMENT_TRANSLATIONS`, `_ITEM_ZONE`, and icon mappings; detects parent-variant relationships from `-rennrad/-gravel/-mtb/-city` suffixes; upserts into the new table
- [x] Add call to `_seed_recommendation_items()` in `run_seed()` 
- [x] Run seed and verify: 112 items created (89 clothing, 23 equipment, 49 variants), parent-variant relationships correct, translations match
- [x] **Checkpoint**: Verified — `cl-shorts` has no parent, `cl-shorts-rennrad` has `parent_id=cl-shorts`, equipment items like `eq-helmet-rennrad` have no parent (no generic `eq-helmet` exists)

## Phase 2: Backend — Translation Cache Service

**Owner: Backend Developer**

- [x] Create `backend/app/services/item_cache.py` — in-memory cache that loads all `RecommendationItem` rows from DB on init, provides synchronous `get_clothing_translation(item_id, locale)` and `get_equipment_translation(item_id, locale)` functions with the same `ItemTranslation` return type
- [x] Add a `refresh()` method to the cache for invalidation after admin edits
- [x] Initialize the cache on app startup (in `backend/app/main.py` lifespan)
- [x] Update `backend/app/rules/translations.py` — `get_clothing_translation` and `get_equipment_translation` read from cache first, fall back to hardcoded dicts for tests without DB <!-- Approach: modified existing functions instead of changing clothing_rules.py/equipment_rules.py directly -->
- [x] Verify `clothing_rules.py` and `equipment_rules.py` unchanged — they call the same functions as before
- [x] Verify `bike_profiles.py` doesn't read translations directly — confirmed, it only maps item IDs
- [x] Verify `SHOE_VENTILATION`, `get_condition_reason_translation`, `get_tip_translation`, `get_repair_kit_translation` remain unchanged in `translations.py`
- [x] Run backend tests — 114 rule tests pass (2 pre-existing safety_rules failures unrelated)
- [ ] **Checkpoint**: Manual verification — generate a ride report via `POST /api/rides/report` and confirm clothing/equipment names and reasons are identical to before the change

## Phase 3: Backend — Admin & Public API Endpoints

**Owner: Backend Developer**

- [x] Create `backend/app/api/routes/admin/items.py` with endpoints:
  - `GET /api/admin/items` — list all items with filtering (type, zone), include parent-variant grouping
  - `GET /api/admin/items/{id}` — single item detail
  - `PUT /api/admin/items/{id}` — update item metadata (name_de, name_en, reason_de, reason_en, zone, icon), invalidate cache after save
- [x] Create `backend/app/schemas/recommendation_item.py` — request/response schemas for admin CRUD
- [x] Register the items router in `backend/app/api/routes/admin/__init__.py`
- [x] Create `GET /api/items` public endpoint (no auth) — returns `[{id, name, type}]` for agent consumption in `backend/app/api/routes/items.py`
- [x] Refactor existing `GET /api/admin/products/clothing-items` to read from cache — removed hardcoded `_ITEM_ZONE` and `_BIKE_SUFFIXES` from `products.py`
- [ ] Write backend tests for the new endpoints (list, get, update, public items)
- [ ] **Checkpoint**: Manual verification — call all new endpoints via curl/Swagger, verify responses

## Phase 4: Backend — Agent Integration

**Owner: Backend Developer**

- [x] Update the agent job request payload (in `backend/app/api/routes/admin/agent.py`) to include the item list from DB when starting extraction jobs
- [x] Update `agent/server.py` — accept `itemIds` in job request schemas, pass it to extraction functions
- [x] Update `agent/extractor.py` — remove hardcoded `VALID_ITEM_IDS` dict, accept `item_ids` as parameter in `extract_products()` and `extract_product_with_category()`
- [x] Update `_format_item_ids_for_prompt()` to work with the passed-in item list instead of the global constant
- [x] Run `make test-agent` — 37 pass, 1 pre-existing scraper failure unrelated
- [ ] **Checkpoint**: Manual verification — trigger a URL-based extraction job from the admin panel, confirm the agent receives the item list

## Phase 5: Backend — Cleanup

**Owner: Backend Developer**

- [ ] Remove `CLOTHING_TRANSLATIONS` and `EQUIPMENT_TRANSLATIONS` dicts from `backend/app/rules/translations.py` (keep `SHOE_VENTILATION`, condition reason translations, tip translations, WMO translations, and helper functions that don't use the removed dicts)
  <!-- Deferred: hardcoded dicts kept as fallback for tests without DB. Can be removed after test infrastructure seeds items into test DB. -->
- [x] Remove `_ITEM_ZONE` dict and `_BIKE_SUFFIXES` from `backend/app/api/routes/admin/products.py`
- [x] Remove `VALID_ITEM_IDS` from `agent/extractor.py`
- [x] Updated agent test — removed `TestValidItemIds` class and `VALID_ITEM_IDS` import
- [x] Run `make test-backend` and `make test-agent` — all passing (pre-existing failures only)

## Phase 6: Frontend — Admin Items Page

**Owner: Frontend Developer**

- [x] Create `frontend/src/api/admin/items.ts` — API client functions: `fetchItems()`, `fetchItem(id)`, `updateItem(id, data)`, `fetchPublicItems()`
- [x] Create `frontend/src/pages/admin/AdminItemsPage.tsx` — list page with:
  - Filter bar (type: clothing/equipment, zone dropdown)
  - Grouped list: generic items with indented variants underneath
  - Click row → open edit drawer/dialog
- [x] Create edit form component (drawer or dialog) with fields: name_de, name_en, reason_de, reason_en, zone (select), icon (text input), read-only ID and type, helper text explaining placeholder syntax
- [x] Add i18n keys for the items admin page in `de.json` and `en.json`
- [x] Add "Items" nav entry to the admin sidebar/navigation
- [x] Register the route in `App.tsx` under admin routes (lazy-loaded, `RequireAdmin`)
- [x] Run `cd frontend && npm run build` — no type errors
- [ ] **Checkpoint**: Manual verification — navigate to admin items page, verify list loads with correct grouping, edit an item's German name, save, confirm it persists, generate a ride report and confirm the updated name shows

## Phase 7: Integration & Final Testing

**Owner: Backend Developer + Frontend Developer**

- [ ] Run `make test-backend` — all tests pass
- [ ] Run `make test-agent` — all tests pass
- [ ] Run `cd frontend && npm run build` — no type errors
- [ ] Update `project/ARCHITECTURE.md` — add `RecommendationItem` to data models section, add new API endpoints to endpoint table
- [ ] **Checkpoint**: Manual verification — full feature walkthrough:
  1. Admin items page loads, filters work, variants grouped correctly
  2. Edit an item's name and reason in both DE and EN → changes persisted
  3. Generate ride report → updated name/reason appears in recommendations
  4. Trigger agent extraction job → agent receives item list from backend
  5. Admin product edit → matchesItemId dropdown shows DB-driven items
  6. Switch language (DE ↔ EN) → correct translations everywhere
