# Milestone 10: Cleanup + Polish

## What

Remove leftover sample data imports, unused files, and ensure everything works end-to-end.

## Frontend cleanup

- Remove `frontend/src/data/sample-products.ts` (replaced by API in M2)
- Remove `frontend/src/data/sample-routes.ts` (replaced by API in M7)
- Remove `frontend/src/data/sample-faq.ts` (replaced by API in M2)
- Remove static about me content (replaced by API in M2)
- Update `frontend/src/pages/ReportPage.tsx` — Replace remaining sampleProducts import with API-fetched products for inline product links
- Verify all sample-* imports are gone
- Remove any dead code from prior milestones

## Implementation guidelines

- **Run the full test suite** and fix any regressions before cleanup.
- **Check for unused imports and dead code** in both backend and frontend after removing sample data files.
- **Review all TODO/FIXME comments** left during earlier milestones and resolve them.
- **Verify Docker Compose** from a clean state: `docker compose down -v && docker compose up --build` — everything should seed and work from scratch.
- **Check error handling end-to-end**: API down, bad input, expired tokens, network failures — frontend should handle all gracefully.
- **Verify admin flow**: Run LLM agent → products land as drafts → publish via admin API → visible on frontend.

## Tests

- `tests/test_e2e.py` (full integration — tests the complete flow):
  - `test_full_ride_flow` — Create user → plan ride → get report → save route → verify route has condition.
  - `test_product_browsing` — List categories → get category detail → verify product data.
  - `test_auth_lifecycle` — Authenticate → access protected route → token refresh → access again.
  - `test_contact_form_anonymous` — Submit contact form without auth → stored in DB.
  - `test_admin_content_lifecycle` — Admin creates draft product → not in public API → publishes → appears in public API.
  - `test_faq_from_api` — FAQ items load from API, ordered correctly.
  - `test_about_from_api` — About sections load from API with correct content.
- Run full suite: `pytest --tb=short -q` — all tests from M1–M9 pass with no warnings.

## Verify (full end-to-end)

1. `docker compose up` → all services healthy (backend, frontend, PostgreSQL, Authentik)
2. Plan a ride → live weather report with real recommendations
3. Authenticate via Authentik → protected routes accessible → logout
4. Save route from report → My Routes → edit → delete
5. Products page loads from DB (seeded + any agent-imported)
6. FAQ page loads from DB
7. About page loads from DB with rendered markdown
8. Location search proxies through backend
9. Contact form stores in DB
10. Admin API: create/update/delete content → reflected in public pages
11. No console errors, no broken imports
12. `pytest` passes entire suite with no failures
