# API Endpoints

> Last updated by spec-docs skill. Reflects codebase as of the latest run.

All endpoints are mounted under the `/api` prefix. Auth column indicates: 🔓 public, 🔒 authenticated user, 🛡️ admin only.

## Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/health` | 🔓 | Health check (not under `/api`) |

## Auth (`/api/auth`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/auth/me` | 🔒 | — | Get current user profile |
| POST | `/api/auth/login` | 🔓 | 10/min | Authenticate with username + password, returns OIDC tokens |
| POST | `/api/auth/register` | 🔓 | 5/min | Create new account, returns OIDC tokens |
| POST | `/api/auth/change-password` | 🔒 | 5/min | Change password for authenticated user |
| POST | `/api/auth/forgot-password` | 🔓 | 3/min | Initiate password recovery (always returns 200) |
| POST | `/api/auth/reset-password` | 🔓 | 5/min | Complete password reset with email token |

## Rides (`/api/rides`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/rides/report` | 🔓 | 20/min | Generate a ride weather report with recommendations. Optional `route_id` query param to update saved route condition. Accepts optional auth token. |

## Routes (`/api/routes`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/routes` | 🔒 | List saved routes for current user |
| GET | `/api/routes/{route_id}` | 🔒 | Get a specific saved route |
| POST | `/api/routes` | 🔒 | Create a new saved route |
| PUT | `/api/routes/{route_id}` | 🔒 | Update a saved route |
| DELETE | `/api/routes/{route_id}` | 🔒 | Delete a saved route |
| POST | `/api/routes/{route_id}/share` | 🔒 | Generate a share token/URL for a route |
| DELETE | `/api/routes/{route_id}/share` | 🔒 | Revoke sharing for a route |

## Shared (`/api/shared`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| GET | `/api/shared/{token}` | 🔓 | 10/min | View a shared ride report (re-generates with current weather) |

## Products (`/api/products`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/products` | 🔓 | List product categories with product counts (supports locale) |
| GET | `/api/products/{category_id}` | 🔓 | Get category detail with products, shops, and affiliate disclosure (supports locale) |

## FAQ (`/api/faq`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/faq` | 🔓 | List published FAQ items (supports locale) |

## About (`/api/about`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/about` | 🔓 | List published about-me content sections (supports locale) |
| GET | `/api/about/{section_key}` | 🔓 | Get a specific about section (supports locale) |

## App Info (`/api/app-info`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/app-info` | 🔓 | List published app info sections (supports locale) |
| GET | `/api/app-info/{section_key}` | 🔓 | Get a specific app info section (supports locale) |

## Contact (`/api/contact`)

| Method | Path | Auth | Rate Limit | Description |
|--------|------|------|------------|-------------|
| POST | `/api/contact` | 🔓 | 5/min | Submit a contact/feedback form (Turnstile captcha required) |

## Geocoding (`/api/geocoding`)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/geocoding/search` | 🔓 | Search for location suggestions by query string |
| GET | `/api/geocoding/reverse` | 🔓 | Reverse geocode lat/lon to an address |

## Admin (`/api/admin`)

All admin endpoints require the `require_admin` dependency (authenticated user with `is_admin=true`).

### Admin Products

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/products` | 🛡️ | List products (paginated, filterable by search/category/shop/published) |
| GET | `/api/admin/products/{product_id}` | 🛡️ | Get a single product |
| POST | `/api/admin/products` | 🛡️ | Create a product |
| PUT | `/api/admin/products/{product_id}` | 🛡️ | Update a product |
| DELETE | `/api/admin/products/{product_id}` | 🛡️ | Delete a product |
| POST | `/api/admin/products/bulk` | 🛡️ | Bulk import products (optional `replaceCategory` to clear first) |

### Admin Categories

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/categories` | 🛡️ | List all product categories |
| POST | `/api/admin/categories` | 🛡️ | Create a category |
| PUT | `/api/admin/categories/{category_id}` | 🛡️ | Update a category |

### Admin Shops

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/shops` | 🛡️ | List all shops |
| POST | `/api/admin/shops` | 🛡️ | Create a shop |
| PUT | `/api/admin/shops/{shop_id}` | 🛡️ | Update a shop |

### Admin FAQ

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/faq` | 🛡️ | List all FAQ items (including unpublished) |
| POST | `/api/admin/faq` | 🛡️ | Create a FAQ item |
| PUT | `/api/admin/faq/{faq_id}` | 🛡️ | Update a FAQ item |
| DELETE | `/api/admin/faq/{faq_id}` | 🛡️ | Delete a FAQ item |
| PUT | `/api/admin/faq/reorder` | 🛡️ | Reorder FAQ items |

### Admin About

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/about` | 🛡️ | List all about content sections |
| POST | `/api/admin/about` | 🛡️ | Create an about section |
| PUT | `/api/admin/about/{about_id}` | 🛡️ | Update an about section |
| DELETE | `/api/admin/about/{about_id}` | 🛡️ | Delete an about section |

### Admin App Info

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/app-info` | 🛡️ | List all app info sections |
| POST | `/api/admin/app-info` | 🛡️ | Create an app info section |
| PUT | `/api/admin/app-info/{item_id}` | 🛡️ | Update an app info section |
| DELETE | `/api/admin/app-info/{item_id}` | 🛡️ | Delete an app info section |

### Admin Contacts

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/api/admin/contacts` | 🛡️ | List contact messages (paginated, filterable by search/category) |
| GET | `/api/admin/contacts/{contact_id}` | 🛡️ | Get a single contact message |
