# Plan: BIKE-24 — Item-Level Product Matching

> Status: Phase 2 Complete — Awaiting Integration Testing
> Feature spec: [BIKE-24](../features/BIKE-24-item-level-product-matching.md)
> Created: 2026-03-18

## Phase 1: Agent — LLM Extraction with `matches_item_id` (Backend Developer)

- [x] Add a `VALID_ITEM_IDS` constant to agent with all known `cl-*` / `eq-*` item IDs and English names (sourced from `backend/app/rules/translations.py`)
- [x] Add `matches_item_id: str | None = None` field to the `ProductData` model in `agent/extractor.py`
- [x] Update `EXTRACTION_PROMPT` to include `matches_item_id` in the extraction fields, with the full list of valid item IDs as reference
- [x] Update `SINGLE_URL_EXTRACTION_PROMPT` to include `matches_item_id` in the extraction fields, with the full list of valid item IDs as reference
- [x] Update `_products_to_bulk_payload()` in `agent/server.py` to pass `p.matches_item_id` instead of omitting it
- [x] Update `_run_extract_url_job()` in `agent/server.py` to pass `product.matches_item_id` instead of hardcoding `None`
- [x] Update agent tests to cover the new `matches_item_id` field in extraction and payload
- [x] **Checkpoint**: Run `make test-agent` — all tests pass.

## Phase 2: Backend — Rewrite Product Matching (Backend Developer)

- [x] Rewrite `match_products_to_clothing()` in `backend/app/services/product_matching.py` to match by `matches_item_id` instead of zone
- [x] Rewrite `match_products_to_equipment()` to match by `matches_item_id` with prefix matching for equipment (e.g., `eq-lights` matches `eq-lights-before-sunrise`)
- [x] Remove `ICON_TO_ZONE` and `EQUIPMENT_TO_CATEGORY` mappings (dead code)
- [x] Add unit tests for the new matching logic: exact match, multiple candidates with weather scoring, no match returns nothing, equipment prefix matching
- [x] **Checkpoint**: Run `make test-backend` — all tests pass. Generate a ride report and verify each clothing item has its own specific product (or no product if none matched).
