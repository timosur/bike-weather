# Milestone 2: Public Content APIs + Frontend Wiring

## What

Products, FAQ, and About Me pages load from the database instead of static imports. All endpoints are public (read-only). Admin CRUD comes in M6.

## Backend files

- `backend/app/schemas/product.py` — Response schemas matching frontend Product, Shop, ProductCategory, AffiliateDisclosure types
- `backend/app/schemas/faq.py` — FaqItemResponse (id, question, answer, category)
- `backend/app/schemas/about.py` — AboutContentResponse (section_key, title, body, image_url)
- `backend/app/api/__init__.py` — Main APIRouter
- `backend/app/api/routes/__init__.py`
- `backend/app/api/routes/products.py`:
  - `GET /api/products` → list categories with product counts (only published products)
  - `GET /api/products/{categoryId}` → products in category + shops + disclosure
- `backend/app/api/routes/faq.py`:
  - `GET /api/faq` → list all published FAQ items, ordered by display_order
- `backend/app/api/routes/about.py`:
  - `GET /api/about` → list all published about sections, ordered by display_order
  - `GET /api/about/{section_key}` → single section by key

## Frontend files

- New `frontend/src/api/client.ts` — apiFetch<T>(path, options) wrapper (sets JSON headers, prepends /api, will add auth later)
- New `frontend/src/api/products.ts` — fetchCategories(), fetchCategoryDetail(categoryId)
- New `frontend/src/api/faq.ts` — fetchFaqItems()
- New `frontend/src/api/about.ts` — fetchAboutSections(), fetchAboutSection(key)
- Modify `frontend/vite.config.ts` — Add server.proxy: { '/api': 'http://localhost:8000' }
- Modify `frontend/src/pages/ProductsPage.tsx` — Replace static import with API fetch + loading state
- Modify `frontend/src/pages/ProductCategoryPage.tsx` — Replace static import with API fetch + loading state
- Modify `frontend/src/pages/FaqPage.tsx` — Replace static sample-faq import with API fetch + loading state
- Modify `frontend/src/pages/AboutPage.tsx` — Replace static content with API fetch + loading state, render markdown body

## Implementation guidelines

- Route handlers should be thin: validate input, call a query/service, serialize with Pydantic schema, return.
- Response schemas are separate from DB models — don't expose internal fields (e.g. `is_published`, `updated_at`).
- Include the main APIRouter in `app/main.py` so all future route modules are auto-included.
- Product count per category should be computed via a DB query (JOIN + COUNT), not by loading all products into memory.
- All public content endpoints filter by `is_published = True` — unpublished drafts are only visible via admin endpoints (M6).
- About content `body` is stored as markdown. The frontend renders it — the API returns raw markdown.

## Tests

- `tests/test_api/test_products.py`:
  - `test_list_categories_returns_all` — GET /api/products returns all seeded categories with correct product counts.
  - `test_list_categories_response_shape` — Verify response matches the expected schema (fields, types).
  - `test_get_category_detail_returns_products` — GET /api/products/{categoryId} returns products, shops, and disclosure.
  - `test_get_category_detail_unknown_id_returns_404` — Non-existent categoryId returns 404.
  - `test_get_category_detail_response_shape` — Verify product objects have all expected fields (name, price, shop, image, etc.).
  - `test_unpublished_products_not_in_list` — Products with is_published=False don't appear in public endpoints.
- `tests/test_api/test_faq.py`:
  - `test_list_faq_returns_published_items` — GET /api/faq returns seeded FAQ items.
  - `test_list_faq_ordered_by_display_order` — Items are returned in correct order.
  - `test_unpublished_faq_not_in_list` — Unpublished FAQ items are excluded.
- `tests/test_api/test_about.py`:
  - `test_list_about_returns_published_sections` — GET /api/about returns seeded sections.
  - `test_get_about_section_by_key` — GET /api/about/intro returns the correct section.
  - `test_get_about_section_unknown_key_returns_404` — Non-existent key returns 404.
  - `test_unpublished_about_not_in_list` — Unpublished sections are excluded.

## Verify

- Navigate to /products → categories load from API
- Click a category → products load from API with shop info and disclosure
- Navigate to /faq → FAQ items load from API
- Navigate to /about → about sections load from API with rendered markdown
- Check network tab: requests go to /api/*
- `pytest` passes all tests (including M1)
