# Milestone 11: Internationalization (English + German)

## What

Add full i18n support so the app works in both English (en) and German (de). Static UI strings are handled on the frontend with `react-i18next`. Dynamic DB content (products, FAQ, about sections) gains a translations table so admins can provide localized versions. The backend serves content in the language requested via `Accept-Language` header or `?lang=` query parameter. German is the default language.

## Architecture

```
Frontend (react-i18next)
  ├── Static strings → JSON translation files (en.json, de.json)
  ├── Language state (already exists in App.tsx) → drives i18next.changeLanguage()
  └── API calls include Accept-Language header

Backend (FastAPI)
  ├── Language detection middleware → reads Accept-Language / ?lang= → sets request locale
  ├── ContentTranslation table → stores per-field translations for DB content
  └── Content endpoints → return translated fields when available, fall back to default
```

## Database

- New table `ContentTranslation`:
  - `id` — UUID, primary key
  - `entity_type` — string (e.g. "product", "faq_item", "about_content", "product_category", "affiliate_disclosure")
  - `entity_id` — UUID, FK to the translated record
  - `locale` — string ("en" or "de"), 5-char max
  - `field_name` — string (e.g. "name", "description", "question", "answer", "title", "body", "text")
  - `value` — text, the translated content
  - `created_at`, `updated_at` — timestamps
  - Unique constraint on (`entity_type`, `entity_id`, `locale`, `field_name`)

This design avoids duplicating entire rows per language. The default language (de) is stored directly on the entity; only non-default translations go into `ContentTranslation`.

## Backend files

- New `backend/app/models/translation.py` — `ContentTranslation` SQLModel
- Modify `backend/app/models/__init__.py` — Export new model
- New Alembic migration — Create `content_translation` table
- New `backend/app/services/translation.py`:
  - `get_translations(session, entity_type, entity_id, locale) → dict[str, str]` — Fetch all field translations for an entity
  - `get_bulk_translations(session, entity_type, entity_ids, locale) → dict[UUID, dict[str, str]]` — Batch fetch for list endpoints
  - `apply_translations(entity, translations)` — Return a copy of the entity with translated fields overlaid
  - `set_translation(session, entity_type, entity_id, locale, field_name, value)` — Upsert a translation
- New `backend/app/middleware/locale.py`:
  - Middleware that parses `Accept-Language` header (prefer) or `?lang=` query param
  - Normalizes to "en" or "de" (default: "de")
  - Stores locale on `request.state.locale`
- Modify `backend/app/main.py` — Register locale middleware
- Modify `backend/app/api/routes/products.py`:
  - List and detail endpoints read `request.state.locale`
  - When locale != "de", fetch translations and overlay on response fields (name, description)
  - Category endpoints also translate name and description
- Modify `backend/app/api/routes/content.py` (FAQ, about, disclosure):
  - Same pattern: read locale, overlay translations on translatable fields
- Modify `backend/app/api/routes/weather.py`:
  - Recommendation engine output (clothing names, condition labels, tips) — add translation mappings for rule-based output strings. Store these as a static dict in the service or as a small JSON file (`backend/app/data/recommendation_translations.json`), not in the DB, since they are code-driven, not admin-editable.
- New `backend/app/api/routes/admin_translations.py`:
  - `GET /api/admin/translations/{entity_type}/{entity_id}` — List all translations for an entity
  - `PUT /api/admin/translations/{entity_type}/{entity_id}/{locale}` — Upsert translations (body: `{ "field_name": "value", ... }`)
  - `DELETE /api/admin/translations/{entity_type}/{entity_id}/{locale}` — Remove all translations for an entity+locale
  - All routes require admin auth
- Modify `backend/app/seed.py`:
  - Add English translations for all seeded content (products, categories, FAQ, about, disclosure)

## Frontend files

- Install `i18next`, `react-i18next`, `i18next-browser-languagedetector` in `frontend/package.json`
- New `frontend/src/i18n/index.ts` — i18next initialization:
  - Default language: "de"
  - Fallback language: "de"
  - Interpolation escapeValue: false (React handles escaping)
  - Load translations from bundled JSON
- New `frontend/src/i18n/locales/de.json` — German translation strings (all static UI text)
- New `frontend/src/i18n/locales/en.json` — English translation strings
- Modify `frontend/src/main.tsx` — Import `./i18n` to initialize before app renders
- Modify `frontend/src/App.tsx`:
  - Connect existing `language` state to `i18next.changeLanguage()`
  - Use `useEffect` to sync: when `language` changes, call `i18n.changeLanguage(language)`
  - Replace hardcoded navigation labels and footer text with `t()` calls
- Modify `frontend/src/api/client.ts`:
  - Read current language from i18next
  - Add `Accept-Language` header to all API requests
- Modify all page and component files to use `useTranslation()` hook:
  - `frontend/src/components/shell/AppShell.tsx` — Nav labels, footer, language toggle
  - `frontend/src/components/ride-planner/RidePlanner.tsx` — Form labels, buttons, presets, validation messages, help text
  - `frontend/src/components/ride-report/RideReport.tsx` — Tab labels, buttons, condition labels
  - `frontend/src/components/auth/AuthPage.tsx` — Form labels, buttons, validation messages
  - `frontend/src/components/contact/ContactPage.tsx` — Form labels, categories, success message
  - `frontend/src/components/my-routes/MyRoutes.tsx` — Title, empty state
  - `frontend/src/components/my-routes/EmptyRoutes.tsx` — Empty state text
  - `frontend/src/pages/ImprintPage.tsx` — Legal text
  - `frontend/src/pages/PrivacyPolicyPage.tsx` — Privacy text
  - `frontend/src/pages/ProductsPage.tsx` — Page heading, labels
  - `frontend/src/pages/ProductCategoryPage.tsx` — Labels, breadcrumbs
  - `frontend/src/pages/FaqPage.tsx` — Page heading, category labels
  - `frontend/src/pages/AboutMePage.tsx` — Page heading
  - `frontend/src/pages/LoginPage.tsx` — Auth prompts

## Translation key structure

Organize keys by feature domain in the JSON files:

```json
{
  "common": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "delete": "Löschen",
    "edit": "Bearbeiten",
    "loading": "Laden...",
    "error": "Fehler",
    "back": "Zurück"
  },
  "nav": {
    "planner": "Routenplaner",
    "products": "Produkte",
    "faq": "FAQ",
    "about": "Über mich",
    "contact": "Kontakt",
    "myRoutes": "Meine Routen",
    "login": "Anmelden",
    "logout": "Abmelden"
  },
  "planner": {
    "startLocation": "Startort",
    "departure": "Abfahrt",
    "bikeType": "Fahrradtyp",
    "intensity": "Intensität",
    "getWeather": "Wetter abrufen",
    "presets": { ... }
  },
  "report": { ... },
  "auth": { ... },
  "contact": { ... },
  "routes": { ... },
  "products": { ... },
  "faq": { ... },
  "footer": { ... }
}
```

## Implementation guidelines

- **Default language is German.** The `de.json` file is the source of truth. `en.json` is the translation. This matches the existing app where most hardcoded strings are German.
- **Static vs dynamic content:** Static UI strings (labels, buttons, messages) go in frontend JSON files. Dynamic content from the DB (product names, FAQ text, about sections) is translated via the `ContentTranslation` table and served by the backend.
- **Recommendation engine strings:** Clothing item names, condition descriptions, and tips from the rule-based engine are static code strings. Translate them using a JSON mapping file in the backend (`recommendation_translations.json`), keyed by the German string with English values. The endpoint reads `request.state.locale` and maps output strings accordingly.
- **Fallback behavior:** If a translation is missing for a field, return the default (German) value. Never return empty strings or keys.
- **Do not translate slugs, URLs, or technical identifiers.** Only user-facing display text.
- **Legal pages (Imprint, Privacy Policy):** These are largely static frontend content. Provide both German and English versions in the translation JSON files. If the legal text is long, split into keyed paragraphs.
- **SEO help text** in the planner component: translate the full help/description block.
- **Pluralization:** Use i18next's built-in plural support where needed (e.g. "1 Route" vs "2 Routen" / "1 route" vs "2 routes").
- **No lazy loading of translations** for this milestone — bundle both locales. The JSON files are small enough.
- **Language persistence:** Store the user's language preference in localStorage. The existing language state in App.tsx already defaults to "de"; connect it to i18next and persist changes.

## Tests

### Backend

- `tests/test_services/test_translation.py`:
  - `test_get_translations_returns_fields` — Translations for a product return correct field values.
  - `test_get_translations_missing_returns_empty` — No translations returns empty dict.
  - `test_get_bulk_translations` — Batch fetch returns translations keyed by entity ID.
  - `test_set_translation_creates` — Upserting a new translation creates a row.
  - `test_set_translation_updates` — Upserting an existing translation updates the value.
  - `test_apply_translations_overlays_fields` — Entity fields are replaced with translated values.
  - `test_apply_translations_partial` — Only translated fields are replaced; others remain default.
- `tests/test_api/test_translations.py`:
  - `test_products_list_default_locale` — GET /api/products without language header returns German content.
  - `test_products_list_english` — GET /api/products with `Accept-Language: en` returns English-translated names/descriptions.
  - `test_products_list_english_fallback` — Product without English translation returns German values.
  - `test_faq_list_english` — FAQ items returned in English when requested.
  - `test_about_english` — About sections returned in English when requested.
  - `test_category_detail_english` — Category name/description translated.
  - `test_lang_query_param` — `?lang=en` works same as Accept-Language header.
  - `test_invalid_locale_falls_back` — Unknown locale (e.g. "fr") falls back to "de".
- `tests/test_api/test_admin_translations.py`:
  - `test_list_translations` — Admin can list translations for an entity.
  - `test_upsert_translations` — Admin can create/update translations.
  - `test_delete_translations` — Admin can delete translations for an entity+locale.
  - `test_non_admin_rejected` — Non-admin user gets 403.
- `tests/test_middleware/test_locale.py`:
  - `test_accept_language_header_parsed` — "en" extracted from header.
  - `test_lang_query_param_overrides_header` — Query param takes precedence.
  - `test_default_locale_is_de` — No header/param defaults to "de".
  - `test_unsupported_locale_defaults` — "fr" defaults to "de".
- `tests/test_services/test_recommendation_translations.py`:
  - `test_recommendation_output_german` — German locale returns German clothing/condition strings.
  - `test_recommendation_output_english` — English locale returns English clothing/condition strings.

### Frontend

No test framework is configured, so no frontend unit tests. Verify manually per the checklist below.

## Verify

1. App loads in German by default — all UI text is German.
2. Click language toggle → all static UI text switches to English instantly (no page reload).
3. Refresh page → language preference persists (localStorage).
4. Products page in English → product names and descriptions are in English (from API).
5. Switch to German → products show German text.
6. FAQ page in English → questions and answers in English.
7. About page in English → section titles and body in English.
8. Plan a ride in English → form labels, presets, validation messages all in English.
9. Ride report in English → clothing recommendations, condition labels, tips in English.
10. Contact form in English → category options, labels, success message in English.
11. My Routes in English → page title, empty state in English.
12. Imprint and Privacy Policy pages switch language correctly.
13. Product with no English translation → falls back to German content gracefully.
14. Admin can manage translations via `/api/admin/translations/` endpoints.
15. `pytest` passes all tests (including M1–M10).
