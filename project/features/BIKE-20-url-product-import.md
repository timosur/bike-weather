# BIKE-20: URL-Based Product Import

| Field            | Value                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| **ID**           | BIKE-20                                                                |
| **Status**       | Planned                                                                |
| **Created**      | 2026-03-14                                                             |
| **Dependencies** | BIKE-19 (Agent Service Refactor), BIKE-10 (Admin Panel), BIKE-4 (Product Catalog) |

## Description

Allow admins to import a product by simply pasting its URL — from any shop, not just pre-configured ones. The agent fetches the page, runs LLM extraction to pull structured product data (name, price, image, description, weather metadata), auto-detects the shop from the domain, and suggests a category. The admin reviews and approves before the product is saved. This replaces the need to configure shops or categories upfront for one-off imports.

## Scope

### In Scope

- New "Import by URL" section in the admin product import page
- Single URL input field (one product at a time)
- Agent endpoint that accepts an arbitrary URL and extracts product data
- Auto-detection of shop from URL domain (create new shop entry or match existing)
- LLM-based category suggestion from extracted product data
- Admin review screen showing extracted data with editable shop and category fields
- Standard approval flow before saving to database
- For unknown shops: import with raw URL (no affiliate tag); admin can edit later

### Out of Scope

- Batch/multi-URL import (one URL per import)
- Automatic affiliate tag injection for unknown shops
- Changes to existing category-based or search-based import flows
- Shop scraping configuration (search URLs, rate limits) for new shops
- Automatic scheduling or recurring imports

## User Stories

### US-1: Import Product by URL

**As an** admin, **I want to** paste a product URL from any online shop and have the system extract product details automatically, **so that** I can quickly add products to the catalog without manual data entry.

**Acceptance Criteria:**

- [ ] AC-1: Admin can enter a single product URL in a dedicated input field on the product import page
- [ ] AC-2: System fetches the page, extracts text, and runs LLM extraction to produce structured product data (name, price, image URL, description, weather metadata)
- [ ] AC-3: If extraction fails (unsupported page, bot protection, LLM error), a clear error message is shown with the reason
- [ ] AC-4: Extracted product data is displayed in a review screen before saving

### US-2: Auto-Detect Shop from URL

**As an** admin, **I want the** system to automatically detect or suggest the shop based on the product URL's domain, **so that** I don't have to manually look up or create shop entries.

**Acceptance Criteria:**

- [ ] AC-5: System extracts the domain from the URL and matches it against existing shops (by domain or base URL)
- [ ] AC-6: If a matching shop exists, it is pre-selected in the review screen
- [ ] AC-7: If no matching shop exists, a new shop name is suggested based on the domain (e.g., `bike-discount.de` → "Bike Discount")
- [ ] AC-8: Admin can override the suggested shop — either by selecting a different existing shop or editing the suggested name
- [ ] AC-9: If a new shop is created, it is saved with the domain as the base URL and no affiliate tag

### US-3: LLM Category Suggestion

**As an** admin, **I want the** system to suggest a product category based on the extracted product data, **so that** I can quickly confirm or adjust the categorization without browsing the full category list.

**Acceptance Criteria:**

- [ ] AC-10: After extraction, the LLM suggests one category from the existing category list based on product name, description, and type
- [ ] AC-11: The suggested category is pre-selected in a dropdown on the review screen
- [ ] AC-12: Admin can override by selecting any other existing category from the dropdown
- [ ] AC-13: If the LLM cannot determine a category, no category is pre-selected and the admin must choose one manually

### US-4: Review and Approve Imported Product

**As an** admin, **I want to** review and edit the extracted product data before it is saved to the database, **so that** I can correct any extraction errors and ensure data quality.

**Acceptance Criteria:**

- [ ] AC-14: Review screen shows all extracted fields: name, price, image (preview), description, affiliate URL, weather metadata (temp range, precipitation, wind)
- [ ] AC-15: All fields are editable by the admin on the review screen
- [ ] AC-16: Admin can approve to save the product or cancel to discard
- [ ] AC-17: On approval, the product is saved to the database with the selected shop and category associations
- [ ] AC-18: A success message confirms the product was created, with a link to view/edit it in the admin product list

### US-5: Handle Unknown Shops Gracefully

**As an** admin, **I want to** import products from shops that have no affiliate tag configured, **so that** I can still grow the catalog and add affiliate details later.

**Acceptance Criteria:**

- [ ] AC-19: Products from unknown shops are imported with the raw product URL (no affiliate tag transformation)
- [ ] AC-20: The review screen shows a notice when the shop has no affiliate tag configured
- [ ] AC-21: After import, the admin can edit the product or shop to add affiliate details at any time

## Edge Cases

- **EC-1: URL is not a product page** (e.g., homepage, category listing, blog post) — LLM extraction returns no product data → show "Could not extract product information from this URL. Please ensure the URL points to a single product page."
- **EC-2: Page blocks scraping** (bot protection, Cloudflare challenge, 403) — agent returns a scraping error → show "Could not access this page. The shop may be blocking automated access."
- **EC-3: LLM extraction returns partial data** (e.g., name but no price) — show extracted fields with empty fields highlighted; admin can fill in missing data manually before approving.
- **EC-4: URL is from an already-configured shop** (e.g., Amazon, BikeComponents) — match existing shop, apply affiliate tag if configured, pre-select shop in review.
- **EC-5: Duplicate product** (URL already imported) — detect by matching affiliate URL or generated product ID; warn admin "This product may already exist" with link to the existing product entry.
- **EC-6: Invalid URL format** — validate client-side before submitting; show "Please enter a valid URL."
- **EC-7: Very large page** (heavy JS-rendered content) — agent has timeout handling; if extraction times out, show "Page took too long to load. Try again or enter product details manually."
- **EC-8: Image URL is relative or behind auth** — store the extracted image URL as-is; display may fail but admin can update it later.

## Services Affected

| Service      | Changes                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------- |
| **Agent**    | New endpoint for single-URL extraction with category suggestion; no shop config required     |
| **Backend**  | New admin route for URL import; shop auto-detection logic; create-shop-on-import capability  |
| **Frontend** | New "Import by URL" UI section in admin product import page; review/edit form for single product |

---

<!-- Appended by architecture skill -->

## Tech Design

### Service Impact Map

```
Agent:    1 new job type (POST /jobs/extract-url) — single-URL extraction + category suggestion via job system
Backend:  2 new admin proxy routes + approval route
          Shop model gains `base_url` field + migration
          New service function: shop auto-detection by domain
Frontend: New "Import by URL" tab/section on AdminProductImportPage
          Reuses existing progress (SSE) + review flow
Database: 1 migration (add `base_url` column to `shops` table)
```

### Data Flow (Job-Based)

```
Admin pastes URL
       │
       ▼
Frontend ──POST /api/admin/agent/jobs/extract-url { url, categories }──▶ Backend (proxy)
       │                                                                       │
       │                                              POST /jobs/extract-url ──▶ Agent
       │                                                                       │
       │                                              Agent creates job, spawns async task:
       │                                              fetch page → LLM extract product + suggest category
       │
       ◀── { jobId, status: "pending" }
       │
       ▼
Frontend ──GET /api/admin/agent/jobs/{jobId}/stream──▶ SSE progress (scraping → extracting → completed)
       │
       ▼  (on "completed")
Frontend ──GET /api/admin/agent/jobs/{jobId}──▶ Backend (proxy) ──▶ Agent
       │
       ◀── { job with products: [1 product], suggestedCategoryId }
       │
       │  Backend enriches: detect shop by URL domain, check duplicates
       │
       ▼
Admin reviews/edits (product data, shop selector, category dropdown)
       │
       ▼
Frontend ──POST /api/admin/agent/jobs/{jobId}/approve-url { product, shopId, categoryId, newShop? }──▶ Backend
       │
       │  1. If newShop: create Shop record (base_url from domain, no affiliate tag)
       │  2. Generate product ID, apply affiliate tag if shop has one
       │  3. Create product via existing product creation logic
       │
       ◀── { product: AdminProduct, shopCreated: bool }
```

### Reusing the Job System

The existing job system (job lifecycle, SSE streaming, job manager) is reused for consistency. The new `POST /jobs/extract-url` job type differs from existing job types in:

- **No shop/category required upfront** — shop is resolved by the backend at review time; category is suggested by the LLM
- **Single product output** — job always produces exactly 1 product (vs. batch jobs producing many)
- **Category suggestion** — accepts a category list so the LLM can pick the best match; stored on the job result alongside the product

This keeps the admin experience consistent: start job → watch progress → review → approve.

### Component Structure (Frontend)

```
AdminProductImportPage (existing — add tab/section)
├── [Tab: "Category Import"] — existing ImportConfigForm flow
└── [Tab: "Import by URL"]   — new
    ├── UrlImportForm
    │   └── URL input + "Extract" button
    ├── ImportProgress (reused) — SSE stream display
    └── UrlImportReview (shown after job completes)
        ├── Product fields (name, price, image preview, description, weather metadata) — all editable
        ├── Shop selector (auto-detected or "Create new" with editable name)
        ├── Category dropdown (LLM suggestion pre-selected)
        ├── Notice: "No affiliate tag configured" (when applicable)
        ├── Duplicate warning (if product URL already exists)
        └── Approve / Cancel buttons
```

### Data Model Changes

**Shop model — add `base_url` field:**

```
shops table gains:
- base_url: str | null — the shop's domain/base URL (e.g., "bike-components.de")
```

This enables matching incoming URLs to existing shops by domain. Existing shops get `base_url` populated via a data migration. New shops created during URL import get `base_url` set automatically from the product URL's domain.

### API Design

**Agent — new job endpoint:**

```
POST /jobs/extract-url
  Request:  { url: string, categories: [{ id, name, slug }] }
  Response: { jobId: string, status: "pending" }
```

The job runs asynchronously (same as existing jobs). On completion, the job result contains:

```
GET /jobs/{jobId}
  Response: {
    jobId, status, progress[],
    products: [{ ...ProductData fields }],    ← exactly 1 product
    suggestedCategoryId: string | null,       ← new field on job result
    url: string                               ← the original URL (for shop detection)
  }
```

SSE streaming via `GET /jobs/{jobId}/stream` works identically to existing job types.

**Backend — new admin proxy + approval routes:**

```
POST /api/admin/agent/jobs/extract-url        — proxy to agent (starts job)
  Request: { url: string }
  Auth: 🛡️ admin
  Note: Backend fetches category list from DB, forwards to agent with URL

GET  /api/admin/agent/jobs/{jobId}            — existing proxy (enriched)
  Response enrichment for extract-url jobs:
    + suggestedShop: { id, name, isNew, hasAffiliateTag } | null
    + duplicateOf: { id, name } | null

POST /api/admin/agent/jobs/{jobId}/approve-url — save approved product
  Request: {
    product: { name, description, imageUrl, affiliateUrl, matchesLabel,
               weatherTempMin/Max, weatherPrecipitation, weatherWind, weatherSummary },
    categoryId: string,
    shopId: string | null,       — existing shop ID
    newShop: { name } | null     — create new shop (mutually exclusive with shopId)
  }
  Response: { product: AdminProduct, shopCreated: bool }
  Auth: 🛡️ admin
```

### Tech Decisions

1. **Job-based extraction** — Reuses the existing job system (job manager, SSE streaming, progress tracking) for a consistent admin experience. Even for a single URL, the admin sees the familiar progress → review → approve flow.

2. **Backend orchestrates shop/category at review time** — The agent extracts product data and suggests a category. The backend enriches the result with shop detection (DB query by domain) and duplicate checking when the frontend fetches the job result. This keeps the agent stateless and shop-unaware.

3. **Shop `base_url` field** — Matching by domain requires storing the domain on the Shop model. A simple `base_url` column + DB query is more reliable than string-matching against shop names or IDs.

4. **Category suggestion via LLM prompt** — The category list is passed to the agent at job creation; the extraction prompt includes "suggest the best-matching category from this list." This reuses the existing LLM call (no extra API call).

5. **Single-product approval (not bulk)** — The `approve-url` endpoint creates one product (vs. the batch `approve` endpoint). This allows the simpler response shape with shop creation.

### Dependencies

- **BIKE-19 (Agent Service Refactor)** — must be completed first; BIKE-20 builds on the refactored agent as a pure extraction service
- **No new packages** — uses existing Playwright (agent), httpx (backend proxy), React + Tailwind (frontend)

## Implementation Plan

_See `project/plans/BIKE-20-plan.md` (created by the architecture skill)._

<!-- Appended by QA skill -->
