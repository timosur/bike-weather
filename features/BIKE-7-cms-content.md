# BIKE-7: CMS Content Pages

| Field            | Value                                  |
| ---------------- | -------------------------------------- |
| **ID**           | BIKE-7                                 |
| **Status**       | Deployed                               |
| **Created**      | 2024-01-01                             |
| **Dependencies** | BIKE-9 (i18n for content translations) |

## Description

CMS-driven content pages: About the App, About Me, FAQ (grouped by category), Imprint, and Privacy Policy. Content is managed via the admin panel and served by dedicated API endpoints with locale support.

## Scope

Sub-features and areas covered:

- About the App page — app info sections from CMS
- About Me page — personal/team content sections with image support
- FAQ page — frequently asked questions grouped by category
- Imprint page — legal imprint
- Privacy Policy page
- All content served via backend APIs with locale support (DE/EN)

### Key Files

- `backend/app/api/routes/about.py` — GET /api/about, GET /api/about/{section_key}
- `backend/app/api/routes/app_info.py` — GET /api/app-info, GET /api/app-info/{section_key}
- `backend/app/api/routes/faq.py` — GET /api/faq
- `backend/app/models/about_content.py` — AboutContent model
- `backend/app/models/app_info_content.py` — AppInfoContent model
- `backend/app/models/faq_item.py` — FaqItem model
- `frontend/src/pages/AboutAppPage.tsx` — About the App page
- `frontend/src/pages/AboutMePage.tsx` — About Me page
- `frontend/src/pages/FaqPage.tsx` — FAQ page
- `frontend/src/pages/ImprintPage.tsx` — Imprint page
- `frontend/src/pages/PrivacyPolicyPage.tsx` — Privacy Policy page
- `frontend/src/components/about-app/` — about app components
- `frontend/src/components/about-me/` — about me components
- `frontend/src/components/faq/` — FAQ components
- `frontend/src/components/imprint/` — imprint components
- `frontend/src/components/privacy-policy/` — privacy policy components
- `frontend/src/api/about.ts` — API client for about content
- `frontend/src/api/appInfo.ts` — API client for app info
- `frontend/src/api/faq.ts` — API client for FAQ

## Acceptance Criteria (Summary)

- All content pages render CMS-driven content from the backend
- FAQ items are grouped by category with expand/collapse
- Content is translated based on current locale
- Pages handle empty content gracefully (loading states, fallbacks)
- About Me supports image sections with ordering

---

## Tech Design

_Retroactive — see `docs/spec/architecture.md` and `docs/spec/api.md`._

## QA Results

_No formal QA tracking for retroactive features._

## Deployment

_Deployed to production via ArgoCD. See release skill for version history._
