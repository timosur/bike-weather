# BIKE-16: Search-Based Product Import

| Field            | Value                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| **ID**           | BIKE-16                                                                |
| **Status**       | Planned                                                                |
| **Created**      | 2025-01-01                                                             |
| **Dependencies** | BIKE-4 (product catalog), BIKE-11 (LLM scraper), BIKE-10 (admin panel) |

## Description

Replace category-based product scraping with a search-based import flow. Each clothing item's translation name becomes a search query for shop websites. Products are tagged with a direct `matches_item_id` linking them to specific `cl-*` clothing items, enabling precise 1:1 matching in ride reports instead of the current zone-based heuristic.

## User Stories

### US-1: Search-Based Import Job

**As an** admin, **I want to** import products by searching shops for specific clothing items, **so that** each imported product is directly linked to the clothing item it belongs to.

**Acceptance Criteria:**

- [ ] Admin can select a shop and a clothing item (e.g., `cl-rain-jacket-gravel`) in the import UI
- [ ] Agent searches the shop using the item's English translation name as the search query
- [ ] Extracted products are automatically tagged with `matches_item_id` matching the selected item
- [ ] Import results show the `matches_item_id` in the review table before publishing
- [ ] Admin can approve/reject individual products before publishing

### US-2: Direct Product Matching

**As a** user viewing a ride report, **I want to** see product recommendations that exactly match each clothing item, **so that** I get relevant product suggestions without mismatches.

**Acceptance Criteria:**

- [ ] Product matching uses `matches_item_id` for direct 1:1 lookup instead of zone-based heuristic
- [ ] Each clothing item in the report links to products with the matching `matches_item_id`
- [ ] If no product matches a specific item, no product is shown for that item (no fallback to zone matching)
- [ ] Weather scoring is still applied among candidates with the same `matches_item_id`

### US-3: Bulk Import All Items

**As an** admin, **I want to** trigger a bulk import for all clothing items from a shop at once, **so that** I can populate the full catalog without importing items one by one.

**Acceptance Criteria:**

- [ ] "Import All Items" button starts sequential import for all `cl-*` items against a selected shop
- [ ] Progress indicator shows current item (e.g., "Importing item 3/89: cl-shorts-mtb...")
- [ ] Rate limiting between items prevents overwhelming the shop (≥2s delay)
- [ ] Max 5 products per item per import run
- [ ] Failed items are skipped and reported; import continues with remaining items

### US-4: Clothing Item Dropdown

**As an** admin, **I want to** browse clothing items grouped by body zone and bike type in the import form, **so that** I can easily find the item I want to import products for.

**Acceptance Criteria:**

- [ ] Import form replaces category dropdown with clothing item dropdown
- [ ] Items are grouped by body zone (Head, Eyes, Neck/Face, Upper Body, Legs, Hands, Feet)
- [ ] Bike-type-specific items show their bike type (e.g., "Upper Body — Road: Aero Cycling Jersey")
- [ ] New API endpoint `GET /api/admin/agent/items` returns the item list with name, name_de, zone, and bike type
- [ ] Dropdown supports search/filtering within the grouped list

## Edge Cases

- Shop search returns no results → show "No products found" message, allow retry with different search terms
- Shop blocks scraping or returns errors → job fails gracefully with error message; does not affect other items in bulk import
- `matches_item_id` conflicts (same product imported for different items) → last import wins; admin can reassign manually
- Translation missing for an item → fall back to item ID as search query
- Shop uses a different language than the search term → shops have a `search_language` property (default: "en") that selects the appropriate translation

## Scope

### Backend Changes

- New field `Product.matches_item_id` (nullable, indexed) + Alembic migration
- Update `ProductCreate`/`ProductUpdate` schemas to include `matches_item_id`
- Rewrite `product_matching.py` to use `matches_item_id` lookup instead of zone matching
- New endpoint `GET /api/admin/agent/items` returning clothing items from translations
- Update agent proxy endpoints to support `item_id` parameter

### Agent Changes

- Generate `SEARCH_TERMS` dict from clothing translations (English and German names per `cl-*` item)
- New search-by-item scrape mode: search shop for item name → extract → tag with `matches_item_id`
- Per-shop `search_language` configuration
- Bulk import orchestration with rate limiting and progress tracking
- Update HTTP server with new endpoint for item-based import

### Frontend Changes

- Replace category dropdown with grouped clothing item dropdown in import form
- Show `matches_item_id` column in product review table
- "Import All Items" bulk action button with progress display
- Update admin types and API client for new fields/endpoints

### Key Files (New/Modified)

- `backend/app/models/product.py` — add `matches_item_id` field
- `backend/app/services/product_matching.py` — rewrite matching logic
- `backend/app/api/routes/admin/agent.py` — new items endpoint, update import endpoint
- `agent/search_terms.py` — search terms generated from translations (new)
- `agent/main.py` — new search-by-item scrape pipeline
- `agent/server.py` — new item-based import endpoint
- `agent/job_manager.py` — update job model with `item_id` field
- `frontend/src/components/admin/` — import form updates, item dropdown
- `frontend/src/api/admin/agent.ts` — new API calls for items and item-based import

---

## Tech Design

_See `project/plans/search-based-product-import.md` for the full 6-phase implementation plan._
