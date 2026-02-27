# Milestone 11: Internationalization (English + German)

## What

Add full i18n support so the app works in both English (en) and German (de). **Split approach:**
- **Frontend**: `react-i18next` with ID-based JSON translation files for all static UI strings (~150+ keys)
- **Backend**: Locale middleware + ContentTranslation table for DB content + translation dictionaries for rule-generated text

German is the default language; English is the translation. The backend serves content in the language requested via `Accept-Language` header or `?lang=` query parameter.

## Architecture

```
Frontend (react-i18next)
  ├── Static strings → JSON translation files (en.json, de.json)
  ├── Language state (App.tsx) → drives i18next.changeLanguage()
  ├── Accept-Language header sent with all API calls
  └── localStorage persistence of language preference

Backend (FastAPI)
  ├── LocaleMiddleware → reads Accept-Language / ?lang= → sets request.state.locale
  ├── ContentTranslation table → stores per-field translations for DB content
  ├── Translation service → batch fetch and apply translations
  ├── Rules translation dicts (JSON) → clothing, equipment, weather, labels
  └── API routes → return translated fields based on request locale
```

## Database

New table `ContentTranslation`:
- `id` — primary key
- `entity_type` — string (e.g. "product", "faq_item", "about_content", "product_category", "affiliate_disclosure")
- `entity_id` — string, the ID of the translated entity
- `locale` — string ("en" or "de")
- `field_name` — string (e.g. "name", "question", "answer", "title", "body", "matches_label", "weather_summary", "badge_label", "disclaimer_text")
- `value` — text, the translated content
- `updated_at` — timestamp

Unique constraint on `(entity_type, entity_id, locale, field_name)`.

**Design:** German is stored directly on entities; only non-default (English) translations go into `ContentTranslation`.

---

## Phase 1: Frontend i18next Setup (Foundation)

### Step 1.1: Install Dependencies

In `frontend/`:
```bash
npm install react-i18next i18next i18next-browser-languagedetector
```

### Step 1.2: Create Translation Key Naming Convention

All keys use dot-separated, ID-based hierarchical naming:
```
<domain>.<component>.<element>
```

**Domains:**
- `shell` — AppShell, header, footer, navigation
- `planner` — RidePlanner, LocationPicker, DayLocationList
- `report` — RideReport, WeatherPanel, ClothingItemCard, EquipmentList, ConditionBadge, DayTabs
- `products` — ProductCategories, ProductCategoryDetail, ProductCard, ReportProducts
- `routes` — MyRoutes, RouteCard, EditRouteModal, DeleteConfirmDialog, EmptyRoutes
- `auth` — AuthPage (login/register)
- `contact` — ContactPage
- `faq` — FaqPage
- `about` — AboutMe
- `imprint` — Imprint
- `privacy` — PrivacyPolicy
- `common` — shared labels (Cancel, Save, Delete, Submit, etc.)

### Step 1.3: Create Translation Files

**`frontend/src/i18n/locales/de.json`** (German default, ~150-200 keys)

Structure example:
```json
{
  "shell": {
    "brand": "Fahrrad Wetter",
    "footer": {
      "tagline": "Wetterbasierte Kleidungsempfehlungen für Radfahrer.",
      "copyright": "© {{year}} Fahrrad Wetter. Ein Projekt von <a href='https://github.com/timosur'>timosur</a>",
      "imprint": "Impressum",
      "privacy": "Datenschutz"
    },
    "nav": {
      "planner": "Routenplaner",
      "rideReport": "Fahrtbericht",
      "products": "Produkte",
      "myRoutes": "Meine Routen",
      "aboutMe": "Über mich"
    },
    "langSwitch": {
      "toEn": "Switch to English",
      "toDe": "Auf Deutsch wechseln"
    }
  },
  "planner": {
    "heading": "Was soll ich anziehen?",
    "subheading": "Geben Sie Ihre Fahrtdetails ein — wir sagen Ihnen, was Sie brauchen.",
    "label": {
      "startLocation": "Startort",
      "departure": "Abfahrt",
      "bikeType": "Fahrradtyp",
      "intensity": "Intensität"
    },
    "bikeType": {
      "rennrad": "Rennrad",
      "gravel": "Gravel",
      "mtb": "MTB",
      "city": "City"
    },
    "intensity": {
      "gemuetlich": "Entspannt",
      "moderat": "Moderat",
      "sportlich": "Sportlich"
    }
  },
  "report": {
    "section": {
      "weather": "Wetter",
      "clothing": "Kleidungsempfehlung",
      "equipment": "Ausrüstung"
    },
    "condition": {
      "ideal": "Ideal",
      "good": "Gut",
      "caution": "Vorsicht",
      "notRecommended": "Nicht empfohlen"
    }
  },
  "common": {
    "cancel": "Abbrechen",
    "save": "Speichern",
    "delete": "Löschen",
    "loading": "Laden…"
  }
}
```

**`frontend/src/i18n/locales/en.json`** — Same structure, English values.

Full key inventory: ~150 keys across all domains.

### Step 1.4: Create i18n Configuration

Create `frontend/src/i18n/index.ts`:

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

import de from './locales/de.json'
import en from './locales/en.json'

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      de: { translation: de },
      en: { translation: en },
    },
    fallbackLng: 'de',
    supportedLngs: ['de', 'en'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'bike-weather:lang',
      caches: ['localStorage'],
    },
  })

export default i18n
```

### Step 1.5: Wire i18n into App Entry Point

In `frontend/src/main.tsx`, add `import './i18n'` before the App import.

### Step 1.6: Replace Language State with i18next

In `frontend/src/App.tsx`:
- Remove `useState<'de' | 'en'>('de')`
- Import `useTranslation` from `react-i18next`
- Use `const { i18n } = useTranslation()` and `i18n.language` as current language
- Replace `setLanguage` with `i18n.changeLanguage`
- Replace all hardcoded navigation labels and footer sections with `t()` calls

### Step 1.7: Update API Client to Send Accept-Language

Modify `frontend/src/api/client.ts`:

```typescript
import i18n from '../i18n'

const API_BASE = "/api"

export async function apiFetch<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": i18n.language,
      ...options?.headers,
    },
  })
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`)
  }
  return response.json() as Promise<T>
}
```

---

## Phase 2: Frontend Component Translation (Systematic String Replacement)

Replace all hardcoded strings with `t()` calls across ~30 files:

**Shell Components:**
- `frontend/src/App.tsx` — navigation items, footer sections
- `frontend/src/components/shell/AppShell.tsx` — brand name, language toggle, footer
- `frontend/src/components/shell/UserMenu.tsx` — "Logout"

**Planner Components:**
- `frontend/src/pages/PlannerPage.tsx` — bike type options, intensity options, quick presets
- `frontend/src/components/ride-planner/RidePlanner.tsx` — heading, labels, buttons, validation, SEO section
- `frontend/src/components/ride-planner/LocationPicker.tsx` — button labels, detection status

**Report Components:**
- `frontend/src/pages/ReportPage.tsx` — error messages, empty states
- `frontend/src/components/ride-report/RideReport.tsx` — section headings, buttons
- `frontend/src/components/ride-report/WeatherPanel.tsx` — stat labels
- `frontend/src/components/ride-report/ConditionBadge.tsx` — condition labels
- `frontend/src/components/ride-report/EquipmentList.tsx` — heading
- `frontend/src/components/ride-report/ClothingItemCard.tsx` — alternatives UI
- `frontend/src/components/ride-report/DayTabs.tsx` — date formatting

**Product, Routes, Auth, Contact, FAQ, About, Legal Components:**
- Replace all hardcoded strings with `t()` calls
- Move data arrays (bike types, intensities, categories, etc.) inside component functions to access `t()`

**Important:** Update date formatting in `DayTabs.tsx` and `RouteCard.tsx` to use locale-aware formatting:
```typescript
const locale = i18n.language === 'de' ? 'de-DE' : 'en-US'
date.toLocaleDateString(locale, ...)
```

---

## Phase 3: Backend Locale Middleware

### Step 3.1: Create Locale Middleware

Create `backend/app/middleware/locale.py`:

```python
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

SUPPORTED_LOCALES = {"de", "en"}
DEFAULT_LOCALE = "de"


def _parse_accept_language(header: str) -> str:
    """Return the best matching locale from the Accept-Language header."""
    for part in header.split(","):
        lang = part.split(";")[0].strip().lower()
        short = lang.split("-")[0]
        if short in SUPPORTED_LOCALES:
            return short
    return DEFAULT_LOCALE


class LocaleMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        # Query param takes precedence
        lang_param = request.query_params.get("lang")
        if lang_param and lang_param in SUPPORTED_LOCALES:
            locale = lang_param
        else:
            accept = request.headers.get("accept-language", "")
            locale = _parse_accept_language(accept)

        request.state.locale = locale
        response = await call_next(request)
        response.headers["Content-Language"] = locale
        return response
```

### Step 3.2: Register Middleware in App

In `backend/app/main.py`, add after the CORS middleware:

```python
from app.middleware.locale import LocaleMiddleware

app.add_middleware(LocaleMiddleware)
```

### Step 3.3: Create Locale Dependency Helper

In `backend/app/api/dependencies.py` (or create if missing):

```python
from fastapi import Request

def get_locale(request: Request) -> str:
    return getattr(request.state, "locale", "de")
```

---

## Phase 4: Backend ContentTranslation Model + Migration

### Step 4.1: Create ContentTranslation Model

Create `backend/app/models/content_translation.py`:

```python
from datetime import datetime, timezone
from sqlmodel import Field, SQLModel


class ContentTranslation(SQLModel, table=True):
    __tablename__ = "content_translations"

    id: int | None = Field(default=None, primary_key=True)
    entity_type: str = Field(index=True)  # "product", "faq_item", "about_content", etc.
    entity_id: str = Field(index=True)     # ID of the entity being translated
    locale: str = Field(index=True)        # "en" (German stored on entity itself)
    field_name: str                         # "name", "question", "answer", "title", "body", etc.
    value: str                              # The translated text
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc).replace(tzinfo=None))
```

Add unique constraint on `(entity_type, entity_id, locale, field_name)` via migration.

### Step 4.2: Register Model

In `backend/app/models/__init__.py`, add:
```python
from .content_translation import ContentTranslation
```

### Step 4.3: Create Alembic Migration

Create `backend/alembic/versions/002_content_translations.py`:

Creates `content_translations` table with columns: `id`, `entity_type`, `entity_id`, `locale`, `field_name`, `value`, `updated_at`, plus a unique index on `(entity_type, entity_id, locale, field_name)`.

---

## Phase 5: Backend Translation Service

### Step 5.1: Create Translation Service

Create `backend/app/services/translation.py`:

```python
"""Translation service: applies locale-specific translations to DB entities."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.content_translation import ContentTranslation

DEFAULT_LOCALE = "de"


async def get_translations(
    session: AsyncSession,
    entity_type: str,
    entity_ids: list[str],
    locale: str,
    fields: list[str],
) -> dict[str, dict[str, str]]:
    """
    Fetch translations for a set of entities.
    Returns: { entity_id: { field_name: translated_value } }
    """
    if locale == DEFAULT_LOCALE:
        return {}  # German is stored on the entity itself

    stmt = select(ContentTranslation).where(
        ContentTranslation.entity_type == entity_type,
        ContentTranslation.entity_id.in_(entity_ids),
        ContentTranslation.locale == locale,
        ContentTranslation.field_name.in_(fields),
    )
    result = await session.execute(stmt)
    rows = result.scalars().all()

    translations: dict[str, dict[str, str]] = {}
    for row in rows:
        translations.setdefault(row.entity_id, {})[row.field_name] = row.value
    return translations


def apply_translation(
    entity_dict: dict,
    translations: dict[str, str],
    fields: list[str],
) -> dict:
    """
    Apply translations to an entity dictionary.
    Only overrides fields that have a translation.
    """
    for field in fields:
        if field in translations:
            entity_dict[field] = translations[field]
    return entity_dict
```

---

## Phase 6: Backend Translation Dictionaries for Rules

### Step 6.1: Create Rules Translation Data

Create `backend/app/rules/translations.py`:

This file contains translation dictionaries for all rule-generated text. Structure:

```python
"""Locale-aware text for clothing rules, equipment rules, weather descriptions, and labels."""

from typing import TypedDict


class ItemTranslation(TypedDict):
    name: str
    reason: str  # f-string template with placeholders


# Clothing item translations keyed by (item_id, locale)
CLOTHING_TRANSLATIONS: dict[tuple[str, str], ItemTranslation] = {
    # German (default)
    ("cl-helmet-cover", "de"): {
        "name": "Wasserdichter Helmüberzug",
        "reason": "Hält den Kopf warm und trocken bei {temp_min:.0f}°C.",
    },
    ("cl-helmet-cover", "en"): {
        "name": "Waterproof Helmet Cover",
        "reason": "Keeps head warm and dry at {temp_min:.0f}°C.",
    },
    # ... all 26 clothing items x 2 locales (include alternatives like cl-jersey-arm, etc.)
}

# Equipment item translations
EQUIPMENT_TRANSLATIONS: dict[tuple[str, str], ItemTranslation] = {
    ("eq-warm-drink", "de"): {
        "name": "Isolierte Flasche mit Warmgetränk",
        "reason": "Warme Flüssigkeit hilft bei {temp_min:.0f}°C die Körpertemperatur zu halten.",
    },
    ("eq-warm-drink", "en"): {
        "name": "Insulated Bottle with Warm Drink",
        "reason": "Warm fluids help maintain body temperature at {temp_min:.0f}°C.",
    },
    # ... all 8 equipment items x 2 locales
}

# WMO weather description translations (keyed by (wmo_code, locale))
WMO_DESCRIPTIONS: dict[tuple[int, str], str] = {
    (0, "de"): "Klarer Himmel",
    (0, "en"): "Clear sky",
    (1, "de"): "Überwiegend klar",
    (1, "en"): "Mainly clear",
    # ... all 30 WMO codes x 2 locales
}

# Label translations for recommendations.py
BIKE_LABELS: dict[tuple[str, str], str] = {
    ("rennrad", "de"): "Rennrad",
    ("rennrad", "en"): "Road bike",
    ("gravel", "de"): "Gravel",
    ("gravel", "en"): "Gravel",
    ("mtb", "de"): "MTB",
    ("mtb", "en"): "MTB",
    ("city", "de"): "City",
    ("city", "en"): "City",
}

INTENSITY_LABELS: dict[tuple[str, str], str] = {
    ("gemuetlich", "de"): "Entspannt",
    ("gemuetlich", "en"): "Relaxed",
    ("moderat", "de"): "Moderat",
    ("moderat", "en"): "Moderate",
    ("sportlich", "de"): "Sportlich",
    ("sportlich", "en"): "Sporty",
}

DAY_LABELS: dict[str, dict[str, str]] = {
    "today": {"de": "Heute", "en": "Today"},
    "day": {"de": "Tag {n}", "en": "Day {n}"},
}

RIDE_NAME_TEMPLATE: dict[str, str] = {
    "de": "{location} Fahrt",
    "en": "{location} Ride",
}

RIDING_STYLE_TEMPLATE: dict[str, str] = {
    "de": "{bike} · {intensity}",
    "en": "{bike} · {intensity}",
}


def get_clothing_translation(item_id: str, locale: str) -> ItemTranslation | None:
    return CLOTHING_TRANSLATIONS.get((item_id, locale))


def get_equipment_translation(item_id: str, locale: str) -> ItemTranslation | None:
    return EQUIPMENT_TRANSLATIONS.get((item_id, locale))


def get_wmo_description(code: int, locale: str) -> str:
    return WMO_DESCRIPTIONS.get((code, locale), WMO_DESCRIPTIONS.get((code, "en"), "Unknown"))
```

### Step 6.2: Modify Clothing Rules to Accept Locale

In `backend/app/rules/clothing_rules.py`:

```python
from app.rules.translations import get_clothing_translation

def _make_item(
    id: str,
    default_name: str,
    icon: str,
    default_reason_template: str,
    locale: str,
    format_vars: dict,
    alternatives: list[dict] | None = None,
) -> dict:
    trans = get_clothing_translation(id, locale)
    name = trans["name"] if trans else default_name
    reason_template = trans["reason"] if trans else default_reason_template
    reason = reason_template.format(**format_vars)

    item: dict = {"id": id, "name": name, "icon": icon, "reason": reason}
    if alternatives:
        # Also translate alternative names
        translated_alts = []
        for a in alternatives:
            alt_trans = get_clothing_translation(a["id"], locale)
            translated_alts.append({
                "id": a["id"],
                "name": alt_trans["name"] if alt_trans else a["name"],
                "icon": a["icon"],
            })
        item["alternatives"] = translated_alts
    return item


def get_clothing_items(weather: WeatherForecast, bike_type: str, intensity: str, locale: str = "de") -> list[dict]:
    # ... same logic, but every _make_item call now passes locale and format_vars
```

Each `_make_item` call changes from inline f-string to separate reason template and format vars.

### Step 6.3: Modify Equipment Rules to Accept Locale

Same pattern in `backend/app/rules/equipment_rules.py`:

```python
def get_equipment_items(
    weather: WeatherForecast,
    distance_km: float | None,
    ride_start_time: str | None = None,
    locale: str = "de",
) -> list[dict]:
    # ... uses get_equipment_translation(item_id, locale)
```

### Step 6.4: Modify Weather Service for Locale-Aware Descriptions

In `backend/app/services/weather.py`:

```python
from app.rules.translations import get_wmo_description

def wmo_to_description(code: int, locale: str = "de") -> str:
    return get_wmo_description(code, locale)
```

### Step 6.5: Modify Recommendations Orchestrator

In `backend/app/services/recommendations.py`:

```python
async def build_report(
    ride_input: RideInputSchema,
    ws: WeatherService | None = None,
    locale: str = "de",
) -> RideReportSchema:
    # ... pass locale to get_clothing_items(), get_equipment_items()
    # ... use BIKE_LABELS.get((ride_input.bikeType, locale), ...)
    # ... use INTENSITY_LABELS.get((ride_input.intensity, locale), ...)
    # ... use DAY_LABELS["today"][locale] or DAY_LABELS["day"][locale].format(n=day_idx+1)
    # ... use RIDE_NAME_TEMPLATE[locale].format(location=...)
    # ... use RIDING_STYLE_TEMPLATE[locale].format(bike=..., intensity=...)
    # ... pass locale to wmo_to_description()
```

---

## Phase 7: Modify API Routes to Apply Translations

### Step 7.1: Rides Route

In `backend/app/api/routes/rides.py`:

```python
from fastapi import APIRouter, HTTPException, Request
from app.dependencies import get_locale

@router.post("/report", response_model=RideReportSchema)
async def create_report(ride_input: RideInputSchema, request: Request) -> RideReportSchema:
    locale = get_locale(request)
    try:
        report = await build_report(ride_input, locale=locale)
    except WeatherServiceError:
        raise HTTPException(status_code=503, ...)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return report
```

### Step 7.2: Products Route

In `backend/app/api/routes/products.py`:

For `list_categories` and `get_category_detail`:
1. Add `request: Request` parameter
2. Extract locale with `get_locale(request)`
3. Fetch translations using the translation service
4. Apply translations to product names, matches_label, weather_summary, category names

```python
@router.get("", response_model=list[ProductCategoryResponse])
async def list_categories(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> list[ProductCategoryResponse]:
    locale = get_locale(request)
    # ... fetch categories ...
    cat_ids = [row.id for row in rows]
    translations = await get_translations(session, "product_category", cat_ids, locale, ["name"])
    # ... build response, applying translations ...
```

### Step 7.3: FAQ Route

In `backend/app/api/routes/faq.py`:

```python
@router.get("", response_model=list[FaqItemResponse])
async def list_faq(
    request: Request,
    session: AsyncSession = Depends(get_session),
) -> list[FaqItemResponse]:
    locale = get_locale(request)
    # ... fetch items ...
    translations = await get_translations(
        session, "faq_item", [i.id for i in items], locale,
        ["question", "answer", "category"]
    )
    return [
        FaqItemResponse(
            id=i.id,
            question=translations.get(i.id, {}).get("question", i.question),
            answer=translations.get(i.id, {}).get("answer", i.answer),
            category=translations.get(i.id, {}).get("category", i.category),
        )
        for i in items
    ]
```

### Step 7.4: About and Other Content Routes

Same pattern in all content routes — extract locale, fetch translations, apply to response.

---

## Phase 8: Seed Data Updates

### Step 8.1: Convert Existing Seed Data to German

In `backend/app/seed.py`:

All entity text must be in German (stored directly on entities):
- Product `matches_label` and `weather_summary` → German
- Product category `name` → German (e.g., "Fahrradjacken")
- FAQ `question`, `answer`, `category` → German
- About content `title`, `body` → German
- Affiliate disclosure `badge_label` ("Anzeige"), `disclaimer_text` → German

### Step 8.2: Seed English Translations

Add `_seed_translations` function in `seed.py` that populates `content_translations` table with English translations for all entities:

```python
async def _seed_translations(session: AsyncSession) -> None:
    translations = [
        # Product categories
        ContentTranslation(entity_type="product_category", entity_id="cat-jackets", locale="en", field_name="name", value="Cycling Jackets"),
        # ... all translatable entities

        # Products
        ContentTranslation(entity_type="product", entity_id="prod-001", locale="en", field_name="matches_label", value="Waterproof Cycling Jacket"),
        # ...

        # FAQ items
        ContentTranslation(entity_type="faq_item", entity_id="was-ist-fahrrad-wetter", locale="en", field_name="question", value="What is Fahrrad Wetter?"),
        # ...

        # About content
        ContentTranslation(entity_type="about_content", entity_id="idea", locale="en", field_name="title", value="The idea"),
        # ...

        # Affiliate disclosure
        ContentTranslation(entity_type="affiliate_disclosure", entity_id="default", locale="en", field_name="badge_label", value="Ad"),
        # ...
    ]

    for trans in translations:
        session.add(trans)
    await session.flush()
```

Call `_seed_translations` from `run_seed`.

---

## Implementation Order (Recommended Sequence)

1. **Backend locale middleware** (Phase 3) — no dependencies, enables locale detection immediately
2. **Backend ContentTranslation model + migration** (Phase 4) — creates DB table
3. **Backend translation service** (Phase 5) — depends on Phase 4
4. **Backend rules translation dicts** (Phase 6.1) — standalone
5. **Backend rules modifications** (Phase 6.2–6.5) — depends on Phase 6.1
6. **Backend route modifications** (Phase 7) — depends on Phases 3, 5, 6
7. **Backend seed data updates** (Phase 8) — depends on Phase 4
8. **Frontend i18next setup** (Phase 1) — standalone, can be done in parallel with backend
9. **Frontend component translation** (Phase 2) — depends on Phase 1
10. **Frontend API client locale header** (Step 1.7) — depends on Phase 1

Phases 1–7 (backend) and 8–10 (frontend) can be done in parallel.

---

## Potential Challenges and Mitigations

1. **Translation coverage:** Imprint and Privacy Policy components contain many legal paragraphs. Each paragraph needs a unique translation key. Use keys like `privacy.section.locationData.body`.

2. **Interpolation in rules:** f-string templates use variables like `temp_min`, `feels`, `precip`, `wind`, `dist`. Translation dictionaries must use the same placeholder names. Document available placeholders.

3. **Mixed-language content:** Some strings already in German ("Meine Routen", "Teilen", "Speichern"), others in English. Normalization to i18n handles this — German in `de.json`, English in `en.json`.

4. **Type safety:** With strict TypeScript, moving hardcoded arrays inside component functions enables `t()` access. Ensure no unused imports.

5. **Date formatting:** `DayTabs.tsx` and `RouteCard.tsx` use hardcoded `'de-DE'`. Change to: `i18n.language === 'de' ? 'de-DE' : 'en-US'`.

6. **Product names:** Brand names (e.g., "Gore Wear C5") are international — don't translate. Only `matches_label` and `weather_summary` need translation.

7. **Alternative clothing items:** Alternatives only have `id`, `name`, `icon`. The `name` field needs translation lookup.

8. **Affiliate disclosure entity_id:** `AffiliateDisclosure` uses auto-increment IDs. For translations, use a stable key like `"default"`.

---

## Critical Files for Implementation

- `frontend/src/api/client.ts` — Accept-Language header (small but critical for locale propagation)
- `backend/app/rules/clothing_rules.py` — 26 items to make locale-aware (most complex backend change)
- `backend/app/services/recommendations.py` — Orchestrator that threads locale through sub-calls
- `frontend/src/components/ride-planner/RidePlanner.tsx` — Largest frontend component (~30+ strings, including SEO content)

---

## Tests

### Backend

- `tests/test_services/test_translation.py`:
  - `test_get_translations_returns_fields`
  - `test_get_translations_missing_returns_empty`
  - `test_get_bulk_translations`
  - `test_set_translation_creates`
  - `test_set_translation_updates`
  - `test_apply_translations_overlays_fields`
  - `test_apply_translations_partial`

- `tests/test_api/test_translations.py`:
  - `test_products_list_default_locale` — GET /api/products without header → German
  - `test_products_list_english` — GET /api/products with `Accept-Language: en` → English
  - `test_products_list_english_fallback` — Product without translation → German
  - `test_faq_list_english`
  - `test_about_english`
  - `test_category_detail_english`
  - `test_lang_query_param` — `?lang=en` works like header
  - `test_invalid_locale_falls_back` — Unknown locale → "de"

- `tests/test_middleware/test_locale.py`:
  - `test_accept_language_header_parsed`
  - `test_lang_query_param_overrides_header`
  - `test_default_locale_is_de`
  - `test_unsupported_locale_defaults`

- `tests/test_services/test_recommendation_translations.py`:
  - `test_recommendation_output_german`
  - `test_recommendation_output_english`

### Frontend

No test framework configured. Verify manually per the checklist below.

---

## Verify

1. App loads in German by default — all UI text is German.
2. Click language toggle → all static UI text switches to English instantly.
3. Refresh page → language preference persists (localStorage).
4. Products page in English → product names/descriptions from API are English.
5. Switch to German → products show German text.
6. FAQ page in English → questions/answers in English.
7. About page in English → section titles/body in English.
8. Plan a ride in English → form labels, presets, validation messages all English.
9. Ride report in English → clothing recommendations, condition labels, tips in English.
10. Contact form in English → category options, labels, success message in English.
11. My Routes in English → page title, empty state in English.
12. Imprint and Privacy Policy pages switch language correctly.
13. Product with no English translation → falls back to German gracefully.
14. `pytest` passes all tests (including M1–M10).

---

## Notes

- **German is the source of truth.** All entities store German text directly; English is an override in the translations table.
- **Static vs dynamic:** Static UI strings in frontend JSON. Dynamic DB content translated via ContentTranslation table, served by backend.
- **Rule-generated text:** Clothing, equipment, weather descriptions, labels stored in translation dicts, looked up at request time.
- **No lazy loading:** Both locales bundled in frontend. JSON files are small.
- **Language persistence:** localStorage (already configured in i18n setup).
- **No translation of slugs/URLs/IDs** — only user-facing display text.
