# Features

> Last updated by spec-docs skill. Reflects codebase as of the latest run.

## User-Facing Features

### Ride Planner (Route: `/planner`, `/planner/:routeId`)

The core feature. Users enter ride details (location, date, time, bike type, intensity, distance) and receive a weather-based report with clothing, equipment, safety, and tip recommendations. Supports loading a saved route for editing.

- **Location search:** Autocomplete via geocoding service (Nominatim)
- **Reverse geocoding:** "Use my location" button resolves lat/lon to an address
- **Ride report generation:** Calls weather API, runs rule engine, returns structured recommendations
- **Captcha:** Optional Turnstile verification after a throttle threshold

### Ride Report (Route: `/report`, `/report/:routeId`)

Displays the generated ride report with weather details and personalized recommendations organized into clothing, equipment, safety warnings, and tips.

### Shared Reports (Route: `/shared/:token`)

Public, unauthenticated view of a shared route's report. Re-generates with current weather data each time it's accessed.

### My Routes (Route: `/routes`) 🔒

Authenticated users can save, edit, and delete their favorite routes. Each saved route stores the full ride input for easy re-use. Features include:

- **Save route:** Persist route with name, location, distance, riding style, and full ride input
- **Edit route:** Update route name and parameters
- **Delete route:** Remove a saved route
- **Share route:** Generate a public share URL; revoke sharing
- **Quick check:** Tap a saved route to generate a fresh report
- **Last condition tracking:** Displays the last weather condition from the most recent report

### Product Recommendations (Route: `/products`, `/products/:categoryId`) ⏸️

*Currently disabled in the UI (routes commented out).* Browse cycling products organized by category, with weather suitability metadata. Products include affiliate links and weather-match labels.

### Authentication

- **Login (Route: `/login`):** Username/password authentication via Authentik headless API
- **Registration:** In-app account creation with Turnstile captcha
- **Forgot password (Route: `/forgot-password`):** Email-based password recovery
- **Reset password (Route: `/reset-password`):** Complete recovery with email token
- **Change password (Route: `/change-password`) 🔒:** Authenticated password change

### Content Pages

- **About the App (Route: `/about`):** CMS-driven content sections describing the application
- **About Me (Route: `/about-me`):** CMS-driven personal/team information
- **FAQ (Route: `/faq`):** CMS-driven frequently asked questions, grouped by category
- **Contact (Route: `/contact`):** Contact/feedback form with Turnstile captcha
- **Imprint (Route: `/imprint`):** Legal imprint page
- **Privacy Policy (Route: `/privacy-policy`):** Privacy policy page

### Internationalization

- Two languages: German (default) and English
- Language toggle in the app shell header
- All user-facing strings go through `useTranslation()` (i18next)
- Backend content translations stored in `content_translations` table; German on the model, English in translations

## Admin Features (Route: `/admin/*`) 🛡️

Admin panel accessible only to users with `is_admin=true`. Nested under `/admin` with a dedicated layout.

### Admin Dashboard (`/admin`)

Overview/landing page for the admin panel.

### Product Management (`/admin/products`)

CRUD for products with search, filtering by category/shop/published status, and pagination. Supports bulk import with optional category replacement.

### Category Management (`/admin/categories`)

Create and edit product categories (name, slug, icon, display order).

### Shop Management (`/admin/shops`)

Create and edit shops (name, logo URL, affiliate tag).

### FAQ Management (`/admin/faq`)

CRUD for FAQ items with drag-and-drop reordering and publish/unpublish toggle.

### About Content Management (`/admin/about`)

CRUD for about-me content sections with image support and ordering.

### App Info Content Management (via admin)

CRUD for app info sections displayed on the "About the App" page.

### Contact Messages (`/admin/contacts`)

View submitted contact/feedback messages with search and category filtering.

## Agent (CLI Tool)

LLM-powered product scraper that uses OpenAI and Anthropic models to extract cycling product data from configured shop websites and publish it to the database. Runs as a standalone CLI, not part of the web application.

## Observability & Telemetry

- **Frontend error tracking:** Automatic capture of JS errors, unhandled promise rejections via Grafana Faro
- **Web Vitals monitoring:** Core Web Vitals (LCP, FID, CLS) reported to Grafana
- **Click tracking:** Global event listener reports button and link clicks as Faro custom events with element tag, text content, page path, and href
- **Distributed tracing:** W3C trace context propagation links frontend browser spans through backend API calls to database queries
- **Backend instrumentation:** OpenTelemetry auto-instruments FastAPI routes, httpx calls, and SQLAlchemy queries
