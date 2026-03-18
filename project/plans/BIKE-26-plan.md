# Plan: BIKE-26 — Item IDs in Database with Admin Management

> Status: Not Started
> Feature spec: [BIKE-26](../features/BIKE-26-item-ids-database.md)
> Created: 2026-03-18

## Phase 1: Backend — Data Model & Seed

**Owner: Backend Developer**

- [ ] Create `backend/app/models/recommendation_item.py` — `RecommendationItem` SQLModel with fields: `id` (str PK), `type` (str), `zone` (str), `icon` (str), `name_de`, `name_en`, `reason_de`, `reason_en`, `parent_id` (nullable FK to self), `display_order` (int)
- [ ] Export the new model in `backend/app/models/__init__.py`
- [ ] Run `alembic revision --autogenerate -m "add recommendation_items table"` to create the migration
- [ ] Apply migration with `alembic upgrade head` and verify table exists
- [ ] Add `_seed_recommendation_items()` to `backend/app/seed.py` that reads from existing `CLOTHING_TRANSLATIONS`, `EQUIPMENT_TRANSLATIONS`, `_ITEM_ZONE`, and icon mappings; detects parent-variant relationships from `-rennrad/-gravel/-mtb/-city` suffixes; upserts into the new table
- [ ] Add call to `_seed_recommendation_items()` in `run_seed()` 
- [ ] Run seed and verify: all ~170 items created, parent-variant relationships correct, translations match
- [ ] **Checkpoint**: Manual verification — query `recommendation_items` table, verify item count, spot-check translations (DE+EN) and parent_id values for a few items like `cl-shorts` (parent) and `cl-shorts-rennrad` (variant)

## Phase 2: Backend — Translation Cache Service

**Owner: Backend Developer**

- [ ] Create `backend/app/services/item_cache.py` — in-memory cache that loads all `RecommendationItem` rows from DB on init, provides synchronous `get_clothing_translation(item_id, locale)` and `get_equipment_translation(item_id, locale)` functions with the same `ItemTranslation` return type
- [ ] Add a `refresh()` method to the cache for invalidation after admin edits
- [ ] Initialize the cache on app startup (in `backend/app/main.py` lifespan or startup event)
- [ ] Update `backend/app/rules/clothing_rules.py` — import translation lookup from cache service instead of `translations.py`
- [ ] Update `backend/app/rules/equipment_rules.py` — same refactor
- [ ] Update `backend/app/rules/bike_profiles.py` if it reads translations directly (verify first)
- [ ] Verify `SHOE_VENTILATION`, `get_condition_reason_translation`, `get_tip_translation`, `get_repair_kit_translation`, `get_wmo_description` — these remain in `translations.py` (they are not item-specific, keep them as-is)
- [ ] Run `make test-backend` — all existing tests must pass with translations now coming from cache/DB
- [ ] **Checkpoint**: Manual verification — generate a ride report via `POST /api/rides/report` and confirm clothing/equipment names and reasons are identical to before the change

## Phase 3: Backend — Admin & Public API Endpoints

**Owner: Backend Developer**

- [ ] Create `backend/app/api/routes/admin/items.py` with endpoints:
  - `GET /api/admin/items` — list all items with filtering (type, zone), include parent-variant grouping
  - `GET /api/admin/items/{id}` — single item detail
  - `PUT /api/admin/items/{id}` — update item metadata (name_de, name_en, reason_de, reason_en, zone, icon), invalidate cache after save
- [ ] Create `backend/app/schemas/recommendation_item.py` — request/response schemas for admin CRUD
- [ ] Register the items router in `backend/app/api/routes/admin/__init__.py`
- [ ] Create `GET /api/items` public endpoint (no auth) — returns `[{id, name, type}]` for agent consumption. Place in a new route file or in an existing public routes file
- [ ] Refactor existing `GET /api/admin/products/clothing-items` to read from DB (or delegate to the new items service) — remove hardcoded `_ITEM_ZONE` dict from `products.py`
- [ ] Write backend tests for the new endpoints (list, get, update, public items)
- [ ] **Checkpoint**: Manual verification — call all new endpoints via curl/Swagger, verify responses. Edit an item's name, then generate a ride report — confirm the updated name appears

## Phase 4: Backend — Agent Integration

**Owner: Backend Developer**

- [ ] Update the agent job request payload (in `backend/app/api/routes/admin/agent.py`) to include the item list from DB when starting extraction jobs
- [ ] Update `agent/server.py` — accept item list in job request, pass it to extraction functions
- [ ] Update `agent/extractor.py` — remove hardcoded `VALID_ITEM_IDS` dict, accept item list as parameter in `extract_products()` and `extract_product_with_category()`
- [ ] Update `_format_item_ids_for_prompt()` to work with the passed-in item list instead of the global constant
- [ ] Run `make test-agent` — all agent tests pass
- [ ] **Checkpoint**: Manual verification — trigger a URL-based extraction job from the admin panel, confirm the agent receives the item list and LLM prompt includes the correct item IDs

## Phase 5: Backend — Cleanup

**Owner: Backend Developer**

- [ ] Remove `CLOTHING_TRANSLATIONS` and `EQUIPMENT_TRANSLATIONS` dicts from `backend/app/rules/translations.py` (keep `SHOE_VENTILATION`, condition reason translations, tip translations, WMO translations, and helper functions that don't use the removed dicts)
- [ ] Remove `_ITEM_ZONE` dict and `_BIKE_SUFFIXES` from `backend/app/api/routes/admin/products.py`
- [ ] Remove `VALID_ITEM_IDS` from `agent/extractor.py` (should already be done in Phase 4)
- [ ] Search for any remaining references to the removed dicts and update them
- [ ] Run `make test-backend` and `make test-agent` — everything passes
- [ ] **Checkpoint**: Manual verification — full ride report generation flow, admin product edit (matchesItemId dropdown still works), agent extraction job

## Phase 6: Frontend — Admin Items Page

**Owner: Frontend Developer**

- [ ] Create `frontend/src/api/admin/items.ts` — API client functions: `fetchItems()`, `fetchItem(id)`, `updateItem(id, data)`, `fetchPublicItems()`
- [ ] Create `frontend/src/pages/admin/AdminItemsPage.tsx` — list page with:
  - Filter bar (type: clothing/equipment, zone dropdown)
  - Grouped list: generic items with indented variants underneath
  - Click row → open edit drawer/dialog
- [ ] Create edit form component (drawer or dialog) with fields: name_de, name_en, reason_de, reason_en, zone (select), icon (text input), read-only ID and type, helper text explaining placeholder syntax
- [ ] Add i18n keys for the items admin page in `de.json` and `en.json`
- [ ] Add "Items" nav entry to the admin sidebar/navigation
- [ ] Register the route in `App.tsx` under admin routes (lazy-loaded, `RequireAdmin`)
- [ ] Run `cd frontend && npm run build` — no type errors
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
