# BIKE-10: Admin Panel

| Field            | Value                                                          |
| ---------------- | -------------------------------------------------------------- |
| **ID**           | BIKE-10                                                        |
| **Status**       | Deployed                                                       |
| **Created**      | 2024-01-01                                                     |
| **Dependencies** | BIKE-6 (authentication), BIKE-11 (LLM scraper for agent proxy) |

## Description

Admin panel for managing all CMS content and products. Accessible only to users with `is_admin=true`. Includes product CRUD with bulk import, category/shop/FAQ management, about content editing, contact message review, and agent proxy for triggering and monitoring LLM scrape jobs.

## Scope

Sub-features and areas covered:

- Admin dashboard (overview landing page)
- Product management — CRUD, search, filter by category/shop/published, pagination, bulk import with optional category replacement
- Category management — create/edit categories (name, slug, icon, display order)
- Shop management — create/edit shops (name, logo URL, affiliate tag)
- FAQ management — CRUD with drag-and-drop reorder and publish/unpublish toggle
- About content management — CRUD for about-me sections with image support and ordering
- App info content management — CRUD for about-the-app sections
- Contact messages — view submitted messages with search and category filtering
- Agent proxy — trigger and monitor LLM scrape jobs (import config form, job status, product review)
- All endpoints behind `require_admin` dependency guard

### Key Files

- `backend/app/api/routes/admin/products.py` — admin product CRUD + bulk import
- `backend/app/api/routes/admin/about.py` — admin about content CRUD
- `backend/app/api/routes/admin/app_info.py` — admin app info CRUD
- `backend/app/api/routes/admin/faq.py` — admin FAQ CRUD
- `backend/app/api/routes/admin/contacts.py` — admin contact messages
- `backend/app/api/routes/admin/agent.py` — agent proxy (trigger/monitor scrape jobs)
- `frontend/src/pages/admin/AdminDashboardPage.tsx` — admin dashboard
- `frontend/src/pages/admin/AdminProductsPage.tsx` — product management
- `frontend/src/pages/admin/AdminProductImportPage.tsx` — product import via agent
- `frontend/src/pages/admin/AdminCategoriesPage.tsx` — category management
- `frontend/src/pages/admin/AdminShopsPage.tsx` — shop management
- `frontend/src/pages/admin/AdminFaqPage.tsx` — FAQ management
- `frontend/src/pages/admin/AdminAboutPage.tsx` — about content management
- `frontend/src/pages/admin/AdminContactsPage.tsx` — contact messages
- `frontend/src/components/admin/` — admin UI components
- `frontend/src/api/admin/` — admin API clients (products, about, faq, contacts, agent)

## Acceptance Criteria (Summary)

- Admin panel only accessible to users with `is_admin=true`
- Products support full CRUD with search, filtering, and pagination
- Bulk import creates/updates products with optional category replacement
- Categories and shops support create/edit with proper validation
- FAQ items support CRUD with drag-and-drop reorder
- About content sections support image upload and ordering
- Contact messages are searchable and filterable by category
- Agent proxy can trigger scrape jobs and display results for review

---

## Tech Design

_Retroactive — see `project/spec/architecture.md` and `project/spec/api.md`._

## QA Results

_No formal QA tracking for retroactive features._

## Deployment

_Deployed to production via ArgoCD. See release skill for version history._
