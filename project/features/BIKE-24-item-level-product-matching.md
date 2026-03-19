# BIKE-24: Item-Level Product Matching

| Field            | Value                                          |
| ---------------- | ---------------------------------------------- |
| **ID**           | BIKE-24                                        |
| **Status**       | Done                                           |
| **Created**      | 2026-03-17                                     |
| **Dependencies** | BIKE-4 (product catalog), BIKE-20 (URL import) |

## Description

Product matching in ride reports is broken. The current logic groups products by **body zone** (e.g., "head", "upperBody") and picks the best weather-scored product per zone. This means every clothing item in the same zone gets the **same product recommendation** — a helmet cover and a headband both show the same "head" product, and a base layer and rain jacket both show the same "upperBody" product.

Fix product matching to use the existing `Product.matches_item_id` field for **direct 1:1 matching** between products and specific clothing/equipment items (e.g., `cl-helmet-cover`, `cl-rain-jacket`). The agent must assign `matches_item_id` during URL-based extraction, and the backend must match by item ID instead of zone.

Products without a `matches_item_id` should **not appear** in reports (no zone fallback).

## Scope

### Backend
- Rewrite `product_matching.py` to match by `matches_item_id` instead of zone
- Remove zone-based matching logic (no fallback)
- Weather scoring still applies among candidates with the same `matches_item_id`

### Agent
- LLM auto-assigns `matches_item_id` during extraction, choosing from the known list of `cl-*` / `eq-*` item IDs
- Pass `matchesItemId` from extraction result to bulk payload (currently hardcoded to `None`)

### Admin (existing UI)
- Admin can override `matches_item_id` in the product edit form (field already exists in schema, ensure it's editable)

### Out of Scope
- Search-based import UI (BIKE-16)
- Bulk import by clothing item (BIKE-16)
- Clothing item dropdown in admin (BIKE-16)
- Multiple `matches_item_id` per product (single string is sufficient)

## User Stories

### US-1: Accurate Product Matching in Reports

**As a** cyclist viewing a ride report, **I want** each clothing item to show a product recommendation that actually matches that specific item, **so that** I see a rain jacket product next to the rain jacket recommendation — not a base layer.

**Acceptance Criteria:**

- [ ] AC-1: Each clothing item in a ride report shows only products whose `matches_item_id` matches that item's ID
- [ ] AC-2: Two different items in the same body zone (e.g., `cl-helmet-cover` and `cl-headband`) show different products
- [ ] AC-3: If no product has a matching `matches_item_id` for an item, no product is shown (no zone fallback)
- [ ] AC-4: Weather scoring is still applied when multiple products match the same item ID — best fit wins
- [ ] AC-5: Bike-type-specific items (e.g., `cl-shorts-rennrad`) match products tagged with that specific ID

### US-2: Agent Assigns Item IDs Automatically

**As an** admin importing a product via URL, **I want** the agent to automatically determine which clothing/equipment item the product matches, **so that** I don't have to manually assign item IDs for every product.

**Acceptance Criteria:**

- [ ] AC-6: Agent LLM extraction includes a `matches_item_id` field in the output
- [ ] AC-7: The LLM is provided the full list of valid `cl-*` and `eq-*` item IDs with their English names as reference
- [ ] AC-8: Extracted `matches_item_id` is persisted to the product record via the bulk API
- [ ] AC-9: If the LLM cannot determine a match, `matches_item_id` is set to `null` (product won't appear in reports)

### US-3: Admin Can Override Item ID

**As an** admin, **I want** to manually set or change a product's `matches_item_id` in the edit form, **so that** I can correct the LLM's assignment or tag older products.

**Acceptance Criteria:**

- [ ] AC-10: Product edit form includes an editable `matches_item_id` field
- [ ] AC-11: Admin can select from a list of valid item IDs or clear the field
- [ ] AC-12: Changes are persisted and immediately affect report matching

## Edge Cases

- **EC-1:** Product with `matches_item_id = null` — not shown in any report; admin must assign an ID manually or re-import.
- **EC-2:** Multiple products match the same item ID — weather scoring picks the best fit for current conditions.
- **EC-3:** LLM assigns wrong item ID (e.g., tags a jacket as gloves) — admin can override via edit form.
- **EC-4:** Bike-type-specific items like `cl-shorts-rennrad` — products should be tagged with the specific suffixed ID, not the base `cl-shorts`.
- **EC-5:** Equipment items (e.g., `eq-lights-before-sunrise`, `eq-lights-after-sunset`) — products tagged with `eq-lights` should match any `eq-lights-*` variant (prefix matching).
- **EC-6:** Item ID not in the known list — agent should set `null`; backend ignores unknown IDs.

## Services Affected

- **Backend:** `product_matching.py` (matching logic rewrite)
- **Agent:** `extractor.py` (LLM prompt), `server.py` (bulk payload)
- **Frontend:** Product edit form (ensure `matches_item_id` field is editable) — minimal change

### Key Files

- `backend/app/services/product_matching.py` — rewrite `match_products_to_clothing()` and `match_products_to_equipment()`
- `backend/app/models/product.py` — `matches_item_id` field (already exists)
- `backend/app/schemas/product.py` — `BulkProductItem.matchesItemId` (already exists)
- `agent/extractor.py` — add `matches_item_id` to LLM extraction prompt and `ProductData` model
- `agent/server.py` — pass `matchesItemId` in `_products_to_bulk_payload()`
- `backend/app/rules/translations.py` — source of truth for valid item IDs

---

## Tech Design

### Service Impact

```
Backend:  Rewrite product matching logic (1 service file)
Agent:    Add matches_item_id to LLM extraction + bulk payload (2 files)
Frontend: No changes needed (edit form already supports matchesItemId)
Database: No migration needed (matches_item_id column already exists)
```

### Backend — Matching Logic Rewrite

**Current flow** (`product_matching.py`):
1. Fetch all published products → group by `matches_zone`
2. Map each clothing item's `icon` → zone via `ICON_TO_ZONE`
3. Pick best weather-scored product from that zone → same product for all items in same zone

**New flow:**
1. Fetch all published products **where `matches_item_id IS NOT NULL`**
2. Group products by `matches_item_id`
3. For each clothing item, look up products where `matches_item_id == item["id"]`
4. Score by weather, pick the best → each item gets its own specific product
5. No match → no product shown (no zone fallback)

**Equipment matching** uses the same approach with one addition: **prefix matching** for equipment items. A product tagged `eq-lights` matches `eq-lights-before-sunrise`, `eq-lights-after-sunset`, etc.

**Removed:** `ICON_TO_ZONE` dict, `EQUIPMENT_TO_CATEGORY` dict (no longer needed).

### Agent — LLM Auto-Assignment

1. **`ProductData` model** — add `matches_item_id: str | None = None`
2. **LLM prompts** (both `EXTRACTION_PROMPT` and `SINGLE_URL_EXTRACTION_PROMPT`) — instruct the LLM to assign a `matches_item_id` from a provided list of valid item IDs with English descriptions
3. **Valid item ID list** — new constant in agent with all known `cl-*` / `eq-*` IDs and English names (sourced from backend's `translations.py`)
4. **Bulk payload** — `_products_to_bulk_payload()` and `_run_extract_url_job()` pass `matches_item_id` through instead of hardcoding `None`

### Frontend — No Changes

The product edit form already includes a `SearchableGroupedSelect` for `matchesItemId` (AC-10/11/12 already met).

### Tech Decisions

| Decision                           | Rationale                                                                                                               |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| No zone fallback                   | Spec is explicit: products without `matches_item_id` don't appear. Accuracy over coverage.                              |
| Hardcoded item ID list in agent    | Agent is stateless with no DB access. Item list is stable. Simpler than adding an API call.                             |
| Prefix matching for equipment only | Equipment has variants (`eq-lights-*`). A product tagged `eq-lights` covers all variants. Clothing uses exact matching. |
| Both LLM prompts updated           | Category-based and single-URL extraction both need the item ID field.                                                   |

### Dependencies

No new packages. All changes use existing infrastructure.

## Implementation Plan

_See `project/plans/BIKE-24-plan.md` (created by the Solution Architect agent)._
