# Amazon Shop + Full Product Coverage for Agent

## TL;DR

Add Amazon.de as a new shop to the product agent, then import exactly 1 product per unique recommendation item ID (~110 products after deduplication). The interactive workflow iterates through all items grouped by body zone, allowing manual ASIN input or auto-search. A new `matches_item_id` field on the Product model enables precise product↔recommendation matching (fixing the currently broken inline product links). Use `gpt-4.1-mini` for cheap extraction.

---

## Problem Summary

- The agent only supports bike-components — Amazon needs to be added
- Only 10 seed products exist but the rules engine recommends **89 clothing + 22 equipment + 17 repair kit = 128 unique item IDs**
- The frontend's inline product links (`findItemProduct` in `RideReport.tsx`) match by `matchesIcon`, but the backend Product model has no `matches_icon` field → **inline product links are completely broken**
- Matching by icon alone is too coarse — e.g. `cl-rain-jacket`, `cl-packable-rain`, `cl-wind-jacket`, `cl-insulated-jacket`, `cl-windstopper-jacket` all share icon `"jacket"`

---

## Product Deduplication

128 item IDs reduce to ~110 distinct Amazon products:

| Dedup group | Items | Products |
|---|---|---|
| Lights (3 IDs → 1 product) | `eq-lights-before-sunrise`, `eq-lights-after-sunset`, `eq-lights-both` | 1 |
| Waterproof gloves (2 IDs → 1 product) | `cl-gloves-waterproof`, `cl-gloves-wp` | 1 |
| Arm warmers alt (2 IDs → 1 product) | `cl-jersey-arm`, `cl-jersey-short-alt` | 1 |
| Leg warmers alt (2 IDs → 1 product) | `cl-tights-warmers`, `cl-shorts-warmers` | 1 |
| Wind vest shared with alt | `cl-wind-vest` = `cl-vest-alt` | 1 |
| Wind jacket shared with alt | `cl-wind-jacket` = `cl-jacket-alt` | 1 |
| 48 bike-type variants | Each is genuinely different (road shoes ≠ MTB shoes) | 48 |
| Generic clothing (no overlap) | 22 unique items | 22 |
| Equipment (after light dedup) | 19 unique items | 19 |
| Repair kit | 17 individual parts | 17 |
| **Total** | | **~110** |

---

## Steps

### 1. New Amazon shop class

Create `agent/shops/amazon.py`:

- Class `AmazonShop(ShopBase)` with `shop_id = "shop-amazon"`, `name = "Amazon.de"`, `affiliate_tag = "bikeweather-21"`
- `search_url(query)` → `https://www.amazon.de/s?k={query}&tag=bikeweather-21`
- Override `inject_affiliate_tag(url)` — Amazon uses `tag=` parameter; parse URL with `urllib.parse`, set/replace tag param. Handle both `/dp/` product URLs and `/s?` search URLs

### 2. Register Amazon in shop registry

In `agent/shops/__init__.py`: import `AmazonShop`, register as `"amazon"` in `_register_shops()`

### 3. Amazon shop seed data

In `seed.py`: add `Shop(id="shop-amazon", name="Amazon.de", affiliate_tag="bikeweather-21")` to the shops seed list

### 4. Switch to cheap LLM

In `config.py`: change `llm_model` default from `"gpt-3.5-turbo"` to `"gpt-4.1-mini"` ($0.40/1M input, $1.60/1M output — cheaper than GPT-3.5 and better quality)

### 5. Add `matches_item_id` to Product model

In `product.py`: add column `matches_item_id: str | None = Field(default=None, index=True)` — stores the recommendation item ID (e.g. `"cl-rain-jacket-rennrad"`, `"eq-lights-both"`)

Create Alembic migration:

```bash
alembic revision --autogenerate -m "add matches_item_id to products"
```

### 6. Update Product API serialization

In the product schemas/API layer: serialize `matches_item_id` as `matchesItemId` in the JSON response. The frontend `Product` type in `types.ts` gets a new optional field `matchesItemId?: string`

### 7. Fix frontend product matching

In `RideReport.tsx:38`: change `findItemProduct` to match by `matchesItemId`:

```typescript
const findItemProduct = (itemId: string) =>
  products.find((p) => p.matchesItemId === itemId);
```

This replaces the broken `matchesIcon` lookup. For equipment items, same logic.

### 8. Expand product categories

Add new categories in `seed.py` to organize ~110 products:

| New ID | Name | Slug | Covers |
|---|---|---|---|
| `cat-base-layers` | Funktionsunterwäsche | `base-layers` | `cl-base-merino-`, `cl-base-wicking-` |
| `cat-jerseys` | Radtrikots | `cycling-jerseys` | `cl-jersey-*`, `cl-thermal-jersey` |
| `cat-vests` | Westen & Windschutz | `vests-wind` | `cl-wind-vest`, `cl-wind-jacket`, `cl-insulated-jacket`, `cl-windstopper-jacket` |
| `cat-rain-gear` | Regenbekleidung | `rain-gear` | `cl-rain-jacket-*`, `cl-packable-rain`, `cl-overpants` |
| `cat-shorts` | Radhosen kurz | `cycling-shorts` | `cl-shorts-*` |
| `cat-socks` | Radsocken | `cycling-socks` | `cl-socks-*` |
| `cat-eyewear` | Brillen | `cycling-eyewear` | `cl-sunglasses`, `cl-glasses`, `cl-glasses-wind` |
| `cat-neckwear` | Hals- & Gesichtsschutz | `neckwear` | `cl-neck-gaiter`, `cl-face-mask` |
| `cat-warmers` | Arm- & Beinlinge | `arm-leg-warmers` | `cl-jersey-arm`, `cl-tights-warmers`, `cl-shorts-warmers` |
| `cat-shoe-covers` | Überschuhe | `shoe-covers` | `cl-shoe-covers` |
| `cat-helmets` | Helme | `cycling-helmets` | `eq-helmet-*` |
| `cat-safety` | Sicherheit | `safety-gear` | `eq-reflective-vest`, `eq-protectors-`, `eq-first-aid`, `eq-lock-`, `eq-bell-*` |
| `cat-repair-kit` | Reparaturset | `repair-kit` | `rk-*` items |
| `cat-hydration` | Trinkflaschen & Ernährung | `hydration-nutrition` | `eq-warm-drink`, `eq-water`, `eq-energy` |

Keep existing: `cat-jackets` (now specifically rain jackets → renamed), `cat-gloves`, `cat-pants` (long tights only), `cat-headwear`, `cat-shoes`, `cat-lights`, `cat-accessories` (mudguards, dry bag, sunscreen)

Update `CATEGORY_MAP` and `ALL_CATEGORIES` in `main.py` to include all new categories.

### 9. Create item registry

New file `agent/item_registry.py` — the complete mapping of all 128 item IDs to metadata:

```python
@dataclass
class ItemEntry:
    item_id: str
    name_de: str
    search_query: str          # optimized for Amazon.de
    category_id: str
    body_zone: str             # for interactive grouping
    dedup_group: str | None    # items sharing one product

ITEM_REGISTRY: dict[str, ItemEntry] = {
    "cl-rain-jacket-rennrad": ItemEntry(
        item_id="cl-rain-jacket-rennrad",
        name_de="Regenjacke Rennrad",
        search_query="Radjacke Rennrad wasserdicht",
        category_id="cat-rain-gear",
        body_zone="TORSO",
        dedup_group=None,
    ),
    "eq-lights-before-sunrise": ItemEntry(
        item_id="eq-lights-before-sunrise",
        name_de="Fahrradlicht Set",
        search_query="Fahrradbeleuchtung Set StVZO",
        category_id="cat-lights",
        body_zone="EQUIPMENT",
        dedup_group="lights",
    ),
    # ... all 128 entries
}
```

Each entry has a German search query optimized for Amazon.de. Items in the same `dedup_group` share one Amazon product.

### 10. Interactive workflow

New function `run_interactive(shop_name)` in `main.py`:

- New CLI flag `--interactive` (mutually exclusive with `--category` and `--all`)
- Groups items by body zone / equipment category (`HEAD` → `EYES` → `NECK` → `BASE LAYER` → ... → `REPAIR KIT`)
- Per group header: `━━━ Head (3 items) ━━━`
- Per item: shows name, item ID, and prompts:
  - **Enter Amazon URL or ASIN** → scrape + extract single product
  - **Press Enter** → auto-search Amazon with `search_query` from registry, extract best match
  - **Type `skip`** → skip this item
  - **Type `batch`** → paste multiple `ASIN:item-id` pairs, one per line
- ASIN detection: if input matches `^[A-Z0-9]{10}$`, convert to `https://www.amazon.de/dp/{ASIN}?tag=bikeweather-21`
- Dedup groups: when first item in a group is imported, subsequent items auto-link to same product (prompt: `"Same product as lights — link? (y/n)"`)
- After accepting a product: publishes immediately via `publish_products()` with `matches_item_id` set
- End summary: `110 items processed, 95 imported, 10 skipped, 5 auto-searched`

Also support `--import-file items.json` for bulk import without interaction:

```json
[
  { "asin": "B09XYZ1234", "item_id": "cl-rain-jacket-rennrad" },
  { "asin": "B09XYZ5678", "item_id": "eq-lights-both" }
]
```

### 11. Single-product extraction

New function `extract_single_product(text, item_id, item_name, shop)` in `extractor.py`:

- Simpler prompt than `EXTRACTION_PROMPT` — designed for a single product page rather than a search results page
- Prompt tells the LLM: `"Extract product data for this specific cycling item: {item_name}. Return exactly ONE JSON object."`
- Returns `ProductData | None`
- Sets `matches_label` to the German translation name from the registry

### 12. Scraper adjustments for Amazon

In `scraper.py`:

**Product page** (`/dp/` or `/gp/product/` URLs):

| Selector | Target |
|---|---|
| `#productTitle` or `#title` | Title |
| `.a-price .a-offscreen`, `.priceToPay` | Price |
| `#feature-bullets ul li` | Features |
| `#imgTagWrapperId img`, `#landingImage` | Image |
| `#productDescription` | Description |

**Search results page** (`/s?` URLs):

| Selector | Target |
|---|---|
| `div[data-component-type="s-search-result"]` | Product tiles |
| `h2 a span` | Title |
| `.a-price .a-offscreen` | Price |
| `h2 a[href]` → inject affiliate tag | Link |
| `.s-image` | Image |

New function `_extract_amazon_tiles(soup)` analogous to `_extract_product_tiles()` for bike-components. Returns structured text for LLM extraction.

### 13. Publisher adjustments

In `publisher.py`:

- `_build_bulk_payload()`: include `matchesItemId` field from `ProductData`
- Expand `CATEGORY_ZONE_MAP` with all new categories
- Update `publish_products()` to **NOT** use `replaceCategory` when in interactive mode (append-only, since importing item by item)

### 14. Update seed products

Replace the 10 hardcoded seed products in `seed.py` with a minimal set (or remove them) — the agent will populate real products. Keep only enough for development/demo purposes.

---

## Verification

- [ ] `python -m agent --interactive --shop amazon` — test manual ASIN input, auto-search, skip, and dedup group handling
- [ ] `python -m agent --import-file items.json --shop amazon` — test bulk import
- [ ] Verify affiliate tag `bikeweather-21` is correctly set in all generated URLs
- [ ] Check backend API: `GET /api/products` — products appear with correct `matchesItemId`, category, shop
- [ ] Frontend integration: inline product links in ride report now resolve (clothing item card shows matching Amazon product)
- [ ] `pytest agent/tests/` — existing tests still pass
- [ ] New tests in `test_shops.py`: `test_amazon_search_url_format`, `test_amazon_affiliate_tag_injection`, `test_amazon_asin_to_url`
- [ ] New test: `test_item_registry_completeness` — verifies every item ID from `translations.py` has a registry entry
- [ ] DB migration runs cleanly: `alembic upgrade head`

---

## Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Product matching | New `matches_item_id` field over broken `matchesIcon` | Precise 1:1 matching between recommendations and products, fixes non-functional inline product links |
| LLM model | `gpt-4.1-mini` over `gpt-3.5-turbo` | Cheaper ($0.40 vs $0.50/1M input) and better extraction quality |
| Categories | Expand from 7 → 21 | Necessary to organize ~110 products meaningfully. Keeps existing IDs stable |
| Dedup groups | Items that map to the same physical product (e.g. 3 light variants) share one Product row; each item ID gets its own `matches_item_id` entry via a join table or comma-separated field | Avoids duplicate Amazon products while maintaining per-item linking |
| Bulk import file | JSON format alongside interactive mode | Importing 110 products one-by-one is tedious; bulk file makes re-runs fast |
| Interactive mode publishing | No `replaceCategory` | Products are appended per-item, not batch-replaced per-category |
