# BIKE-14: App Shell & SEO

| Field            | Value                             |
| ---------------- | --------------------------------- |
| **ID**           | BIKE-14                           |
| **Status**       | Deployed                          |
| **Created**      | 2024-01-01                        |
| **Dependencies** | BIKE-9 (i18n for language toggle) |

## Description

Shared application shell (header, navigation, footer, language toggle) and SEO components. Includes dark mode toggle (class-based Tailwind), skeleton loading states for all pages, and SEO components for meta tags and structured data.

## Scope

Sub-features and areas covered:

- App shell layout — header with navigation, language toggle, auth controls
- Footer with navigation links
- Dark mode toggle — class-based Tailwind dark mode with persistence
- Skeleton loading states for all content pages
- SEO components — meta tags, Open Graph, structured data (JSON-LD)
- Route guards — `RequireAuth` and `RequireAdmin` wrappers
- Responsive navigation (mobile menu)

### Key Files

- `frontend/src/components/shell/` — header, footer, navigation, language toggle, dark mode
- `frontend/src/components/skeleton/` — skeleton loading components
- `frontend/src/components/seo/` — SEO meta tag and structured data components
- `frontend/src/components/common/` — shared UI components
- `frontend/src/App.tsx` — route definitions, RequireAuth/RequireAdmin guards

## Acceptance Criteria (Summary)

- All pages share a consistent header, navigation, and footer
- Language toggle switches between DE and EN
- Dark mode toggle persists preference and applies class-based Tailwind dark styles
- Skeleton states display during content loading
- Pages include appropriate meta tags and structured data for SEO
- Protected routes redirect unauthenticated users; admin routes require `is_admin`

---

## Tech Design

_Retroactive — see `project/ARCHITECTURE.md`._

## QA Results

_No formal QA tracking for retroactive features._

## Deployment

_Deployed to production via ArgoCD. See release skill for version history._
