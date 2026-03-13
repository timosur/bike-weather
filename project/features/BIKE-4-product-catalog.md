# BIKE-4: Product Catalog & Matching

| Field            | Value                 |
| ---------------- | --------------------- |
| **ID**           | BIKE-4                |
| **Status**       | Deployed              |
| **Created**      | 2024-01-01            |
| **Dependencies** | BIKE-1 (ride reports) |

## Description

Browse cycling products organized by category with weather suitability metadata and affiliate links. In ride reports, the backend automatically matches products to clothing recommendations by body zone and weather fit, displaying inline product links next to each clothing item.

## Scope

Sub-features and areas covered:

- Product catalog browse page organized by category
- Category detail pages with product listings
- Weather suitability metadata per product (temp range, precipitation, wind)
- Affiliate links with shop attribution
- Inline product matching in ride reports — products matched to clothing items by body zone and weather conditions
- Product zone pages (products grouped by body zone)
- Affiliate disclosure content

### Key Files

- `backend/app/api/routes/products.py` — GET /api/products, GET /api/products/{category_id}
- `backend/app/services/product_matching.py` — matches products to clothing recommendations
- `backend/app/models/product.py` — Product model with weather metadata
- `backend/app/models/product_category.py` — ProductCategory model
- `backend/app/models/product_bike_type.py` — bike type associations
- `backend/app/models/shop.py` — Shop model
- `backend/app/models/affiliate_disclosure.py` — affiliate disclosure content
- `frontend/src/pages/ProductsPage.tsx` — product catalog browse
- `frontend/src/pages/ProductCategoryPage.tsx` — category detail page
- `frontend/src/pages/ProductZonePage.tsx` — zone-based product view
- `frontend/src/pages/ZoneCategoryProductsPage.tsx` — zone + category products
- `frontend/src/components/product-recommendations/` — product display components
- `frontend/src/api/products.ts` — API client for products

## Acceptance Criteria (Summary)

- Products page displays categories with product counts
- Category pages list products with images, prices, and affiliate links
- Products include weather suitability labels (temp range, precipitation, wind)
- Ride reports show matching products inline with clothing recommendations
- Product matching considers body zone and current weather conditions
- Locale support for product content (DE/EN)

---

## Tech Design

_Retroactive — see `project/ARCHITECTURE.md`._

## QA Results

_No formal QA tracking for retroactive features._

## Deployment

_Deployed to production via ArgoCD. See release skill for version history._
