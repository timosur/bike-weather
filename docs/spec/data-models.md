# Data Models

> Last updated by spec-docs skill. Reflects codebase as of the latest run.

All models use SQLModel (SQLAlchemy + Pydantic). Database is PostgreSQL 16.

## User

**Table:** `users`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PK, auto | Internal user ID |
| `external_id` | str | unique, indexed | OIDC `sub` claim from Authentik |
| `email` | str | unique, indexed | User email |
| `name` | str | | Display name |
| `is_admin` | bool | default: false | Admin privilege flag |
| `created_at` | datetime | default: now (UTC) | Account creation timestamp |

**Notes:** Users are auto-created on first OIDC login via `_find_or_create_user`. If an email matches an existing seeded user, the OIDC identity is bound to that row.

## SavedRoute

**Table:** `saved_routes`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | str | PK | UUID string |
| `user_id` | int | FK → `users.id`, indexed | Owner |
| `name` | str | | Route display name |
| `start_location` | str | | Starting address/location |
| `total_distance` | float | | Distance value |
| `distance_unit` | str | default: "km" | Unit of distance |
| `riding_style` | str | | "Sporty", "Easy", or "Touring" |
| `last_condition` | str | default: "" | Last weather condition from report |
| `last_used` | datetime? | nullable | Last time a report was generated |
| `share_token` | str? | unique, indexed, nullable | Token for public sharing |
| `created_at` | datetime | default: now (UTC) | Creation timestamp |
| `ride_input` | JSONB? | nullable | Full ride input JSON for edit/restore |

**Relationships:** Belongs to User via `user_id`.

## Product

**Table:** `products`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | str | PK | Product identifier |
| `name` | str | | Product name |
| `category_id` | str | FK → `product_categories.id`, indexed | Category |
| `image_url` | str | | Product image URL |
| `price` | float | | Price |
| `currency` | str | default: "EUR" | Currency code |
| `shop_id` | str | FK → `shops.id`, indexed | Shop |
| `affiliate_url` | str | | Affiliate purchase link |
| `matches_zone` | str? | nullable | Weather zone match label |
| `matches_label` | str | | Human-readable match description |
| `weather_temp_min` | float? | nullable | Min suitable temperature |
| `weather_temp_max` | float? | nullable | Max suitable temperature |
| `weather_precipitation` | str | default: "none" | Precipitation suitability |
| `weather_wind` | str | default: "none" | Wind suitability |
| `weather_summary` | str | default: "" | Weather suitability summary |
| `is_published` | bool | default: true | Visibility flag |
| `created_at` | datetime | default: now (UTC) | Creation timestamp |
| `updated_at` | datetime | default: now (UTC) | Last update timestamp |

**Relationships:** Belongs to ProductCategory via `category_id`, belongs to Shop via `shop_id`.

## ProductCategory

**Table:** `product_categories`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | str | PK | Category identifier |
| `name` | str | | Display name |
| `slug` | str | unique, indexed | URL-friendly slug |
| `description` | str | default: "" | Category description |
| `icon` | str | | Icon identifier |
| `display_order` | int | default: 0 | Sort order |

## Shop

**Table:** `shops`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | str | PK | Shop identifier |
| `name` | str | | Shop display name |
| `logo_url` | str | | Shop logo URL |
| `affiliate_tag` | str? | nullable | Affiliate tracking tag |

## FaqItem

**Table:** `faq_items`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | str | PK | FAQ item identifier |
| `question` | str | | The question text (German) |
| `answer` | str | | The answer text (German) |
| `category` | str | | Grouping category |
| `display_order` | int | default: 0 | Sort order |
| `is_published` | bool | default: true | Visibility flag |
| `created_at` | datetime | default: now (UTC) | Creation timestamp |
| `updated_at` | datetime | default: now (UTC) | Last update timestamp |

## AboutContent

**Table:** `about_content`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PK, auto | Internal ID |
| `section_key` | str | unique, indexed | Unique section identifier |
| `title` | str | | Section title (German) |
| `body` | str | | Section body text (German) |
| `image_url` | str? | nullable | Optional section image |
| `display_order` | int | default: 0 | Sort order |
| `is_published` | bool | default: true | Visibility flag |
| `updated_at` | datetime | default: now (UTC) | Last update timestamp |

## AppInfoContent

**Table:** `app_info_content`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PK, auto | Internal ID |
| `section_key` | str | unique, indexed | Unique section identifier |
| `title` | str | | Section title (German) |
| `body` | str | | Section body text (German) |
| `image_url` | str? | nullable | Optional section image |
| `display_order` | int | default: 0 | Sort order |
| `is_published` | bool | default: true | Visibility flag |
| `updated_at` | datetime | default: now (UTC) | Last update timestamp |

## ContactMessage

**Table:** `contact_messages`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PK, auto | Internal ID |
| `category` | str | | Message category (e.g., feedback type) |
| `name` | str | | Sender name |
| `email` | str | | Sender email |
| `message` | str | | Message body |
| `created_at` | datetime | default: now (UTC) | Submission timestamp |

## ContentTranslation

**Table:** `content_translations`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PK, auto | Internal ID |
| `entity_type` | str | indexed | Type of entity ("product", "faq_item", "about_content", etc.) |
| `entity_id` | str | indexed | ID of the entity being translated |
| `locale` | str | indexed | Target locale (e.g., "en") |
| `field_name` | str | | Field being translated ("name", "question", "title", etc.) |
| `value` | str | | Translated text |
| `updated_at` | datetime | default: now (UTC) | Last update timestamp |

**Notes:** German text is stored directly on the entity models. This table stores non-German translations (currently English). The `entity_type` + `entity_id` + `locale` + `field_name` combination identifies a unique translation.

## AffiliateDisclosure

**Table:** `affiliate_disclosures`

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| `id` | int | PK, auto | Internal ID |
| `badge_label` | str | | Disclosure badge text |
| `disclaimer_text` | str | | Full disclaimer text |
| `is_active` | bool | default: true | Whether this disclosure is active |
