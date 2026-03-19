# BIKE-9: Internationalization

| Field            | Value      |
| ---------------- | ---------- |
| **ID**           | BIKE-9     |
| **Status**       | Deployed   |
| **Created**      | 2024-01-01 |
| **Dependencies** | None       |

## Description

Full internationalization with German (default) and English. Frontend uses i18next with language toggle in the header. Backend stores translations in a `content_translations` table (German on the model, English in translations) and respects `Accept-Language` headers via locale middleware.

## Scope

Sub-features and areas covered:

- i18next setup with DE (default) and EN locales
- Language toggle in app shell header
- All user-facing strings via `useTranslation()` hook
- Locale JSON files (`locales/de.json`, `locales/en.json`)
- `Accept-Language` header sent by API client
- Backend `content_translations` table for CMS content (about, FAQ, app info, products)
- Backend locale middleware for extracting language preference
- Translation service for content resolution
- Rule engine translations (clothing, equipment, safety, tips in DE/EN)

### Key Files

- `backend/app/models/content_translation.py` — ContentTranslation model
- `backend/app/services/translation.py` — translation resolution service
- `backend/app/rules/translations.py` — DE/EN translations for recommendation items
- `frontend/src/i18n/` — i18next configuration
- `frontend/src/i18n/locales/de.json` — German translations
- `frontend/src/i18n/locales/en.json` — English translations
- `frontend/src/api/client.ts` — API client with Accept-Language header
- `frontend/src/components/shell/` — language toggle in header

## Acceptance Criteria (Summary)

- App defaults to German; user can switch to English via header toggle
- All UI strings are translated through i18next
- Backend CMS content (about, FAQ, products) returned in the requested locale
- Recommendation text (clothing, equipment, tips) available in DE and EN
- Language preference persists across page navigation
- API client sends `Accept-Language` header on all requests

---

## Tech Design

_Retroactive — see `project/ARCHITECTURE.md`._
