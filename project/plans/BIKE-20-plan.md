# Plan: BIKE-20 — URL-Based Product Import

> Status: Not Started
> Feature spec: [BIKE-20](../features/BIKE-20-url-product-import.md)
> Created: 2026-03-14

## Phase 1: Database — Shop `base_url` Field

- [ ] Add `base_url: str | None` field to `Shop` model in `backend/app/models/shop.py`
- [ ] Create Alembic migration: `cd backend && uv run alembic revision --autogenerate -m "add base_url to shops"`
- [ ] Write a data migration step that populates `base_url` for existing shops (e.g., `shop-amazon` → `amazon.de`, `shop-bike-components` → `bike-components.de`)
- [ ] Update `ShopCreate`, `ShopUpdate`, `ShopAdminResponse` schemas in `backend/app/schemas/product.py` to include `baseUrl`
- [ ] Update `create_shop()` and `update_shop()` routes in `backend/app/api/routes/admin/products.py` to handle `base_url`
- [ ] Update `ShopAdminResponse.from_model()` to include `base_url`
- [ ] Run migration: `cd backend && uv run alembic upgrade head`
- [ ] **Checkpoint**: Manual verification — `GET /api/admin/shops` returns shops with `baseUrl` field; existing shops have correct domain values

## Phase 2: Agent — `POST /extract-url` Endpoint

- [ ] Add `extract_single_url()` function in `agent/main.py` — takes a URL + category list, fetches page, runs LLM extraction, returns one `ProductData` + suggested category ID
- [ ] Extend the LLM extraction prompt in `agent/extractor.py` to accept an optional category list and return a `suggested_category_id` field alongside the product data
- [ ] Add `POST /extract-url` endpoint in `agent/server.py` — accepts `{ url, categories: [{ id, name, slug }] }`, calls `extract_single_url()`, returns `{ product, suggestedCategoryId }`
- [ ] Handle errors: invalid URL (422), fetch failure (502), LLM error (500) — return structured error responses
- [ ] Add agent test for `extract_single_url()` with mocked LLM response
- [ ] **Checkpoint**: Manual verification — `curl -X POST http://localhost:8001/extract-url -d '{"url": "https://www.bike-components.de/...", "categories": [...]}' ` returns extracted product data with a suggested category

## Phase 3: Backend — Import URL Orchestration

- [ ] Create `backend/app/services/shop_detection.py` — `detect_shop_by_url(url, session)` extracts domain from URL, queries shops by `base_url`, returns matched shop or suggests a new shop name from the domain
- [ ] Add `POST /api/admin/agent/import-url` route in `backend/app/api/routes/admin/agent.py`:
  - Validate URL format
  - Fetch category list from DB
  - Call agent `POST /extract-url` with URL + categories
  - Call `detect_shop_by_url()` for shop match
  - Check for duplicate products by `affiliate_url`
  - Return enriched response (product data + shop suggestion + category suggestion + duplicate info)
- [ ] Add `POST /api/admin/agent/import-url/approve` route in `backend/app/api/routes/admin/agent.py`:
  - If `newShop` provided: create new Shop record (generate ID from name, set `base_url` from URL domain, no affiliate tag)
  - Generate product ID from URL + name
  - If shop has affiliate tag: inject it into the product URL
  - Create product record via existing product creation logic
  - Return created product + `shopCreated` flag
- [ ] Add request/response schemas for both endpoints in `backend/app/schemas/product.py`
- [ ] Add backend tests for `detect_shop_by_url()` service function
- [ ] **Checkpoint**: Manual verification — use `curl` or HTTPie to call `POST /api/admin/agent/import-url` with a real product URL; verify response contains extracted product + shop suggestion + category suggestion

## Phase 4: Frontend — URL Import UI

- [ ] Add `UrlImportForm` component in `frontend/src/components/admin/product-import/` — URL input field with "Extract" button, loading spinner, error display
- [ ] Add `UrlImportReview` component in `frontend/src/components/admin/product-import/` — editable product fields, shop selector (existing or create new), category dropdown with LLM suggestion pre-selected, duplicate warning, no-affiliate-tag notice, approve/cancel buttons
- [ ] Add API functions in `frontend/src/api/admin/agent.ts`: `extractProductFromUrl(url)` and `approveUrlImport(data)`
- [ ] Update `AdminProductImportPage.tsx` — add a tab or section for "Import by URL" alongside the existing import flow; wire up UrlImportForm → UrlImportReview → success message
- [ ] Add i18n translation keys for all new UI strings (DE + EN) in the relevant translation files
- [ ] **Checkpoint**: Manual verification — full end-to-end walkthrough in the browser: paste a product URL → see extracted data → edit fields → select shop/category → approve → product appears in admin product list

## Phase 5: Polish & Testing

- [ ] Run `make test-agent` — all agent tests pass
- [ ] Run `make test-backend` — all backend tests pass
- [ ] Run `cd frontend && npm run build` — no TypeScript errors
- [ ] Test edge cases: invalid URL, non-product page, already-imported URL, unknown shop domain
- [ ] Update `project/ARCHITECTURE.md` — add new endpoints to the API table, update agent communication diagram
- [ ] **Checkpoint**: Manual verification — complete feature walkthrough with both a known shop URL (e.g., bike-components.de) and an unknown shop URL; verify shop auto-detection, category suggestion, and product creation all work correctly
