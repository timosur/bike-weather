# Plan: BIKE-20 — URL-Based Product Import

> Status: In Progress (Phase 4)
> Feature spec: [BIKE-20](../features/BIKE-20-url-product-import.md)
> Created: 2026-03-14

## Phase 1: Database — Shop `base_url` Field

- [x] Add `base_url: str | None` field to `Shop` model in `backend/app/models/shop.py`
- [x] Create Alembic migration: `cd backend && uv run alembic revision --autogenerate -m "add base_url to shops"`
- [x] Write a data migration step that populates `base_url` for existing shops (e.g., `shop-amazon` → `amazon.de`, `shop-bike-components` → `bike-components.de`)
- [x] Update `ShopCreate`, `ShopUpdate`, `ShopAdminResponse` schemas in `backend/app/schemas/product.py` to include `baseUrl`
- [x] Update `create_shop()` and `update_shop()` routes in `backend/app/api/routes/admin/products.py` to handle `base_url`
- [x] Update `ShopAdminResponse.from_model()` to include `base_url`
- [x] Run migration: `cd backend && uv run alembic upgrade head`
- [x] **Checkpoint**: Manual verification — `GET /api/admin/shops` returns shops with `baseUrl` field; existing shops have correct domain values

## Phase 2: Agent — `POST /jobs/extract-url` Job Type

- [x] Add `extract_single_url()` function in `agent/main.py` — takes a URL + category list, fetches page, runs LLM extraction, returns one `ProductData` + suggested category ID
- [x] Extend the LLM extraction prompt in `agent/extractor.py` to accept an optional category list and return a `suggested_category_id` field alongside the product data
- [x] Add `POST /jobs/extract-url` endpoint in `agent/server.py` — accepts `{ url, categories: [{ id, name, slug }] }`, creates a job, spawns async `_run_extract_url_job()` task, returns `{ jobId, status }`
- [x] Implement `_run_extract_url_job()` in `agent/server.py` — runs `extract_single_url()`, stores product + `suggestedCategoryId` on job, sends progress events via SSE (scraping → extracting → completed/failed)
- [x] Ensure `GET /jobs/{jobId}` returns `suggestedCategoryId` and `url` fields for extract-url jobs
- [x] Ensure `GET /jobs/{jobId}/stream` works for extract-url jobs (reuses existing SSE infrastructure)
- [x] Add agent test for `extract_single_url()` with mocked LLM response
- [x] **Checkpoint**: Manual verification — `curl -X POST http://localhost:8001/jobs/extract-url -d '{"url": "...", "categories": [...]}'` returns `jobId`; SSE stream shows progress; `GET /jobs/{jobId}` returns extracted product with `suggestedCategoryId`

## Phase 3: Backend — Proxy Routes & Shop Detection

- [x] Create `backend/app/services/shop_detection.py` — `detect_shop_by_url(url, session)` extracts domain from URL, queries shops by `base_url`, returns matched shop or suggests a new shop name from the domain
- [x] Add `POST /api/admin/agent/jobs/extract-url` proxy route in `backend/app/api/routes/admin/agent.py`:
  - Validate URL format
  - Fetch category list from DB (id, name, slug)
  - Forward `{ url, categories }` to agent `POST /jobs/extract-url`
  - Return `{ jobId, status }`
- [x] Enrich `GET /api/admin/agent/jobs/{jobId}` proxy for extract-url jobs:
  - After proxying the agent response, run `detect_shop_by_url()` for shop match
  - Check for duplicate products by matching `affiliate_url` in DB
  - Append `suggestedShop` and `duplicateOf` to the response
- [x] Add `POST /api/admin/agent/jobs/{jobId}/approve-url` route in `backend/app/api/routes/admin/agent.py`:
  - If `newShop` provided: create new Shop record (generate ID from name, set `base_url` from URL domain, no affiliate tag)
  - Generate product ID from URL + name
  - If shop has affiliate tag: inject it into the product URL
  - Create product record via existing product creation logic
  - Return `{ product, shopCreated }`
- [x] Add request/response schemas for new endpoints in `backend/app/schemas/product.py`
- [x] Add backend tests for `detect_shop_by_url()` service function
- [x] **Checkpoint**: Manual verification — call `POST /api/admin/agent/jobs/extract-url` with a real product URL; stream progress via SSE; fetch completed job with shop suggestion; approve and verify product appears in DB

## Phase 4: Frontend — URL Import UI

- [x] Add API functions in `frontend/src/api/admin/agent.ts`: `startExtractUrlJob(url)`, `approveUrlImport(jobId, data)`
- [x] Add `UrlImportForm` component in `frontend/src/components/admin/product-import/` — URL input field with "Extract" button, validates URL format client-side
- [x] Add `UrlImportReview` component in `frontend/src/components/admin/product-import/` — editable product fields, shop selector (existing or create new), category dropdown with LLM suggestion pre-selected, duplicate warning, no-affiliate-tag notice, approve/cancel buttons
- [x] Update `AdminProductImportPage.tsx` — add a tab or section for "Import by URL" alongside the existing import flow; wire up UrlImportForm → ImportProgress (reused, SSE stream) → UrlImportReview → success message
- [x] Add i18n translation keys for all new UI strings (DE + EN) in the relevant translation files
- [ ] **Checkpoint**: Manual verification — full end-to-end walkthrough in the browser: paste a product URL → see extraction progress (SSE) → review extracted data → edit fields → select shop/category → approve → product appears in admin product list

## Phase 5: Polish & Testing

- [ ] Run `make test-agent` — all agent tests pass
- [ ] Run `make test-backend` — all backend tests pass
- [ ] Run `cd frontend && npm run build` — no TypeScript errors
- [ ] Test edge cases: invalid URL, non-product page, already-imported URL, unknown shop domain
- [ ] Update `project/ARCHITECTURE.md` — add new endpoints to the API table, update agent communication diagram
- [ ] **Checkpoint**: Manual verification — complete feature walkthrough with both a known shop URL (e.g., bike-components.de) and an unknown shop URL; verify shop auto-detection, category suggestion, and product creation all work correctly
