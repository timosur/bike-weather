# Milestone 6: Content Admin API

## What

Protected admin endpoints for managing products, FAQ, and about content. Admin role is determined by the `is_admin` flag on the User model (set manually in DB or via Authentik group mapping). No admin UI — content is managed via API (used by the LLM agent in M9 and manually via tools like curl/Postman when needed).

## Backend files

- `backend/app/api/dependencies.py` — Add:
  - `require_admin` — Depends on get_current_user, checks `is_admin` flag, raises 403 if not admin
- `backend/app/schemas/product.py` — Add: ProductCreate, ProductUpdate, ShopCreate, ShopUpdate, CategoryCreate, CategoryUpdate
- `backend/app/schemas/faq.py` — Add: FaqItemCreate, FaqItemUpdate
- `backend/app/schemas/about.py` — Add: AboutContentCreate, AboutContentUpdate
- `backend/app/api/routes/admin/products.py`:
  - `GET /api/admin/products` → list all products (including unpublished), with pagination
  - `GET /api/admin/products/{id}` → single product detail
  - `POST /api/admin/products` → create product
  - `PUT /api/admin/products/{id}` → update product
  - `DELETE /api/admin/products/{id}` → delete product
  - `POST /api/admin/products/bulk` → create/update multiple products (for LLM agent batch imports)
  - `GET /api/admin/categories` → list all categories
  - `POST /api/admin/categories` → create category
  - `PUT /api/admin/categories/{id}` → update category
  - `GET /api/admin/shops` → list all shops
  - `POST /api/admin/shops` → create shop
  - `PUT /api/admin/shops/{id}` → update shop
- `backend/app/api/routes/admin/faq.py`:
  - `GET /api/admin/faq` → list all FAQ items (including unpublished)
  - `POST /api/admin/faq` → create FAQ item
  - `PUT /api/admin/faq/{id}` → update FAQ item
  - `DELETE /api/admin/faq/{id}` → delete FAQ item
  - `PUT /api/admin/faq/reorder` → bulk update display_order
- `backend/app/api/routes/admin/about.py`:
  - `GET /api/admin/about` → list all about sections (including unpublished)
  - `POST /api/admin/about` → create about section
  - `PUT /api/admin/about/{id}` → update about section
  - `DELETE /api/admin/about/{id}` → delete about section

## Implementation guidelines

- **All admin routes** are prefixed with `/api/admin/` and protected by the `require_admin` dependency.
- **Bulk product endpoint**: Accepts a list of products. For each: match by `affiliate_url` (unique identifier for a product from a specific shop). If exists, update fields. If not, create. Return a summary: `{ created: N, updated: N, skipped: N }`. This is the primary interface for the LLM agent.
- **Pagination**: Admin list endpoints support `?page=1&page_size=50` with default page_size=50. Return `{ items: [...], total: N, page: N, page_size: N }`.
- **Soft delete vs hard delete**: Use hard delete for now (content models aren't critical). If needed later, add `deleted_at` column.
- **Audit trail**: Log admin actions (create/update/delete) at INFO level with user email and affected resource. No DB audit table needed yet.
- **Validation**: Product price must be positive. FAQ question and answer must be non-empty. About section_key must be URL-safe slug. Category slug must be unique.

## Tests

- `tests/test_api/test_admin_products.py`:
  - `test_list_products_as_admin` — Admin can list all products including unpublished.
  - `test_list_products_as_non_admin_returns_403` — Regular user gets 403.
  - `test_list_products_unauthenticated_returns_401` — No token gets 401.
  - `test_create_product` — Admin creates product, returns 201.
  - `test_create_product_invalid_data_returns_422` — Missing required fields returns 422.
  - `test_update_product` — Admin updates product fields.
  - `test_delete_product` — Admin deletes product, no longer in list.
  - `test_bulk_create_products` — Bulk endpoint creates new products.
  - `test_bulk_update_existing_products` — Bulk endpoint updates matching products by affiliate_url.
  - `test_bulk_mixed_create_and_update` — Mix of new and existing products handled correctly.
  - `test_bulk_returns_summary` — Response includes created/updated/skipped counts.
- `tests/test_api/test_admin_faq.py`:
  - `test_create_faq_item` — Admin creates FAQ item.
  - `test_update_faq_item` — Admin updates question/answer.
  - `test_delete_faq_item` — Admin deletes FAQ item.
  - `test_reorder_faq` — Bulk reorder updates display_order for all items.
  - `test_faq_admin_requires_admin_role` — Regular user gets 403.
- `tests/test_api/test_admin_about.py`:
  - `test_create_about_section` — Admin creates about section.
  - `test_update_about_section` — Admin updates section body/title.
  - `test_delete_about_section` — Admin deletes about section.
  - `test_duplicate_section_key_returns_409` — Creating section with existing key returns 409.
  - `test_about_admin_requires_admin_role` — Regular user gets 403.

## Verify

- Authenticate as admin user → access admin endpoints
- Create/update/delete products via API → changes reflected in public /api/products
- Create FAQ item as draft (is_published=false) → not visible in /api/faq → publish → visible
- Bulk import products → correct create/update counts returned
- Non-admin user → 403 on all admin endpoints
- `pytest` passes all tests (including M1–M5)
