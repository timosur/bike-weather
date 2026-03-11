# Plan: Search-Based Product Import with Direct Item Matching

## TL;DR

Use translation names as **search queries** for shops. Each product gets tagged with its `matches_item_id` at import time → direct 1:1 matching, no zone/category guessing.

**Example flow:**

```
Translation: ("cl-rain-jacket-gravel", "en") → "Waterproof Gravel Jacket"
     ↓
Search bike-components.de for "Waterproof Gravel Jacket"
     ↓
Extract products, tag each with matches_item_id="cl-rain-jacket-gravel"
     ↓
User plans gravel ride → cl-rain-jacket-gravel → shows exact matching products
```

---

## Problem (Current State)

| Issue                   | Impact                                                  |
| ----------------------- | ------------------------------------------------------- |
| Zone-only matching      | `cl-rain-jacket` might show a jersey (both `upperBody`) |
| No bike-type filtering  | MTB rider sees road bib shorts                          |
| `matches_label` unused  | LLM-generated text never used for matching              |
| Category-based scraping | Import all products, hope matching works later          |

---

## Solution: Search-Based Import

### Key Changes

1. **New field**: `Product.matches_item_id` — direct link to `cl-*` item
2. **Search terms from translations** — English names become search queries
3. **Per-item scraping** — search shops for each clothing item
4. **Direct matching** — `product.matches_item_id == clothing_item.id`

---

## Steps

### Phase 1: Generate Search Terms from Translations

1. **Create `SEARCH_TERMS` dict** from CLOTHING_TRANSLATIONS
   - Extract English names for each `cl-*` item
   - Location: new file `agent/search_terms.py` or inline in job manager

   ```python
   # Auto-generated from translations.py
   SEARCH_TERMS: dict[str, dict[str, str]] = {
       "cl-helmet-cover": {"en": "Waterproof Helmet Cover", "de": "Wasserdichter Helmüberzug"},
       "cl-headband": {"en": "Light Headband", "de": "Leichtes Stirnband"},
       "cl-cycling-cap": {"en": "Cycling Cap", "de": "Radmütze"},
       "cl-sunglasses": {"en": "Sports Sunglasses", "de": "Sport-Sonnenbrille"},
       "cl-glasses": {"en": "Clear Cycling Glasses", "de": "Klare Radbrille"},
       "cl-neck-gaiter": {"en": "Neck Gaiter", "de": "Halstuch / Nackenschutz"},
       "cl-face-mask": {"en": "Face Mask", "de": "Gesichtsmaske / Atemschutz"},
       "cl-base-merino": {"en": "Merino Base Layer", "de": "Merino-Baselayer"},
       "cl-base-wicking": {"en": "Moisture-wicking Base Layer", "de": "Feuchtigkeitsableitendes Unterhemd"},
       "cl-thermal-jersey": {"en": "Thermal Long-sleeve Jersey", "de": "Thermo-Langarmtrikot"},
       "cl-jersey-long": {"en": "Long-sleeve Cycling Jersey", "de": "Langarm-Radtrikot"},
       "cl-jersey-short": {"en": "Short-sleeve Cycling Jersey", "de": "Kurzarm-Radtrikot"},
       "cl-jersey-sleeveless": {"en": "Sleeveless Cycling Jersey", "de": "Ärmelloses Radtrikot"},
       "cl-rain-jacket": {"en": "Waterproof Cycling Jacket", "de": "Wasserdichte Radjacke"},
       "cl-packable-rain": {"en": "Packable Rain Jacket", "de": "Packbare Regenjacke"},
       "cl-wind-jacket": {"en": "Wind Jacket", "de": "Windjacke"},
       "cl-wind-vest": {"en": "Light Wind Vest", "de": "Leichte Windweste"},
       "cl-insulated-jacket": {"en": "Insulated Cycling Jacket", "de": "Isolierte Radjacke"},
       "cl-windstopper-jacket": {"en": "Windproof Cycling Jacket", "de": "Windstopper-Radjacke"},
       "cl-thermal-tights": {"en": "Thermal Cycling Tights", "de": "Thermo-Radhose"},
       "cl-padded-tights": {"en": "Long Padded Cycling Tights", "de": "Lange Radhose mit Polster"},
       "cl-shorts": {"en": "Padded Cycling Shorts", "de": "Gepolsterte Radshorts"},
       "cl-overpants": {"en": "Waterproof Overpants", "de": "Wasserdichte Überhose"},
       "cl-gloves-waterproof": {"en": "Waterproof Winter Gloves", "de": "Wasserdichte Winterhandschuhe"},
       "cl-gloves-warm": {"en": "Warm Cycling Gloves", "de": "Warme Radhandschuhe"},
       "cl-gloves-light": {"en": "Light Cycling Gloves", "de": "Leichte Radhandschuhe"},
       "cl-shoe-covers": {"en": "Waterproof Overshoes", "de": "Wasserdichte Überschuhe"},
       "cl-shoes": {"en": "Cycling Shoes", "de": "Radschuhe"},
       "cl-socks-warm": {"en": "Warm Merino Socks", "de": "Warme Merinosocken"},
       "cl-socks-mid": {"en": "Mid-weight Socks", "de": "Mitteldicke Socken"},
       "cl-socks-thin": {"en": "Thin Merino Socks", "de": "Dünne Merinosocken"},
       # Bike-type specific (56 more entries)
       "cl-shorts-rennrad": {"en": "Bib Shorts (aerodynamic)", "de": "Bib Shorts (aerodynamisch)"},
       "cl-shorts-gravel": {"en": "Gravel Shorts (relaxed fit)", "de": "Gravel-Shorts (Relaxed Fit)"},
       "cl-shorts-mtb": {"en": "MTB Baggy Shorts", "de": "MTB Baggy Shorts"},
       "cl-shorts-city": {"en": "Casual Shorts", "de": "Bequeme Alltagsshorts"},
       # ... all 89 items
   }
   ```

### Phase 2: Update Product Model

2. **Add field to Product model** ([backend/app/models/product.py](backend/app/models/product.py))

   ```python
   matches_item_id: str | None = Field(default=None, index=True)
   # Direct link to cl-* item ID, e.g. "cl-rain-jacket-gravel"
   ```

3. **Create Alembic migration**

   ```bash
   cd backend && uv run alembic revision --autogenerate -m "add matches_item_id to products"
   ```

4. **Update product schemas** ([backend/app/schemas/product.py](backend/app/schemas/product.py))
   - Add `matches_item_id` to create/update/response schemas

### Phase 3: New Import Mode — Search by Item

5. **Add search-by-item job type** to [agent/job_manager.py](agent/job_manager.py)

   ```python
   @dataclass
   class Job:
       id: str
       shop: str
       item_id: str | None = None  # NEW: if set, search for this item
       category: str | None = None  # Existing: category-based scraping
       ...
   ```

6. **Update agent server** ([agent/server.py](agent/server.py))
   - New endpoint: `POST /scrape/item` with `{shop, item_id}`
   - Or modify existing endpoint to accept `item_id` instead of `category`

7. **Update scrape pipeline** ([agent/main.py](agent/main.py) or new file)

   ```python
   async def scrape_by_item(shop: ShopBase, item_id: str, lang: str = "en") -> list[ProductData]:
       """Search shop for products matching a specific clothing item."""
       search_term = SEARCH_TERMS[item_id][lang]
       url = shop.search_url(search_term)

       html = await fetch_page(url)
       text = extract_text(html)

       # Extract products (LLM still infers weather attributes)
       products = await extract_products(text, category=item_id, shop=shop.name)

       # Tag each product with the item_id
       for p in products:
           p.matches_item_id = item_id

       return products
   ```

8. **Shop language configuration** — add to shop base
   ```python
   @property
   def search_language(self) -> str:
       """Language to use for search queries: 'en' or 'de'."""
       return "en"  # Override per shop
   ```

### Phase 4: Simplify Product Matching

9. **Rewrite matching logic** ([backend/app/services/product_matching.py](backend/app/services/product_matching.py))
   ```python
   async def match_products_to_clothing(
       session: AsyncSession,
       clothing_items: list[dict],
       weather: WeatherForecast,
   ) -> ProductRecommendationsSchema | None:
       """Match products to clothing items by direct item_id lookup."""

       item_ids = [item["id"] for item in clothing_items]

       # Fetch products matching any of these item_ids
       result = await session.execute(
           select(Product)
           .where(Product.is_published == True)
           .where(Product.matches_item_id.in_(item_ids))
       )
       products = list(result.scalars().all())

       if not products:
           return None

       # Group by item_id, pick best by weather score
       matched: dict[str, MatchedProductSchema] = {}
       for item_id in item_ids:
           candidates = [p for p in products if p.matches_item_id == item_id]
           if candidates:
               best = max(candidates, key=lambda p: _weather_score(p, weather))
               matched[item_id] = _product_to_schema(best)

       return ProductRecommendationsSchema(matched=matched, ...)
   ```

### Phase 5: Bulk Import All Items

10. **Create bulk import command** — scrape all items for a shop
    ```python
    async def import_all_items(shop: ShopBase, max_per_item: int = 5):
        """Import products for all clothing items from a shop."""
        for item_id in SEARCH_TERMS:
            products = await scrape_by_item(shop, item_id)
            await publish_products(products[:max_per_item])
            await asyncio.sleep(2)  # Rate limiting
    ```

### Phase 6: Admin UI Updates

11. **Update ImportConfigForm** — replace category dropdown with item dropdown

    Current flow:

    ```
    Shop → Category (e.g., "Rain Jackets") → Agent scrapes category page
    ```

    New flow:

    ```
    Shop → Clothing Item (e.g., "cl-rain-jacket-gravel") → Agent searches for "Waterproof Gravel Jacket"
    ```

12. **New API endpoint for item list** — `GET /admin/agent/items`

    ```typescript
    interface AgentItem {
      id: string; // "cl-rain-jacket-gravel"
      name: string; // "Waterproof Gravel Jacket" (from translation)
      name_de: string; // "Wasserdichte Gravel-Jacke"
      category: string; // "upperBody" or existing category for grouping
      bike_type: string | null; // "gravel", "mtb", "rennrad", "city", or null
    }
    ```

13. **Group items in dropdown** by body zone or category

    ```
    ▼ Head
        Waterproof Helmet Cover
        Light Headband
        Cycling Cap
    ▼ Upper Body - Road
        Aero Cycling Jersey (tight)
        Long-sleeve Cycling Jersey (tight)
        Waterproof Road Jacket (tight)
    ▼ Upper Body - Gravel
        Gravel Jersey (relaxed fit)
        Waterproof Gravel Jacket
    ▼ Upper Body - MTB
        MTB Jersey (loose, rugged)
        Waterproof MTB Jacket (rugged)
    ...
    ```

14. **Show item_id in review table** — so admin knows what product will be linked to

    ```
    | Product Name              | matches_item_id          | Weather  | ✓ |
    |---------------------------|--------------------------|----------|---|
    | Gore-Tex Gravel Jacket    | cl-rain-jacket-gravel    | Rain/Wind| ☑ |
    | Castelli Perfetto RoS     | cl-rain-jacket-gravel    | Rain/Wind| ☑ |
    ```

15. **Add "Import All Items" bulk action** (optional)
    - Button to start sequential import for all items in a category group
    - Shows progress: "Importing item 3/89: cl-shorts-mtb..."

16. **Update types** ([frontend/src/components/admin/types.ts](frontend/src/components/admin/types.ts))

    ```typescript
    export interface AgentItem {
      id: string;
      name: string;
      name_de: string;
      zone: string;
      bikeType: string | null;
    }

    export interface AgentJob {
      jobId: string;
      shop: string;
      itemId: string | null; // NEW: replaces category for item-based import
      category: string | null; // Keep for backward compat
      // ...
    }

    export interface AgentBulkProduct {
      // ... existing fields
      matchesItemId: string; // NEW: the item this product will be linked to
    }
    ```

17. **Update API calls** ([frontend/src/api/admin/agent.ts](frontend/src/api/admin/agent.ts))

    ```typescript
    export function fetchAgentItems(): Promise<AgentItem[]> {
      return apiFetch("/admin/agent/items");
    }

    export function startItemImportJob(params: {
      shop: string;
      itemId: string;
      maxProducts: number;
    }): Promise<{ jobId: string; status: string }> {
      return apiFetch("/admin/agent/jobs/item", {
        method: "POST",
        body: JSON.stringify(params),
      });
    }
    ```

---

### Admin UI Mockup

**Before (category-based):**

```
┌─────────────────────────────────────────────────────┐
│ Shop:        [bike-components.de     ▼]             │
│ Category:    [Rain Jackets           ▼]             │
│ Max Products: [5]                                    │
│                                                      │
│              [Start Import]                          │
└─────────────────────────────────────────────────────┘
```

**After (item-based):**

```
┌─────────────────────────────────────────────────────┐
│ Shop:        [bike-components.de     ▼]             │
│                                                      │
│ Import Mode: (●) Single Item  ( ) All Items         │
│                                                      │
│ Clothing Item:                                       │
│ ┌───────────────────────────────────────────────┐   │
│ │ ▼ Upper Body - Gravel                         │   │
│ │     Gravel Jersey (relaxed fit)               │   │
│ │   ● Waterproof Gravel Jacket ←────────────────│   │
│ │     Long-sleeve Gravel Jersey                 │   │
│ │ ▼ Upper Body - MTB                            │   │
│ │     MTB Jersey (loose, rugged)                │   │
│ │     Waterproof MTB Jacket (rugged)            │   │
│ └───────────────────────────────────────────────┘   │
│                                                      │
│ Max Products per Item: [5]                           │
│                                                      │
│ Search term: "Waterproof Gravel Jacket"    (preview)│
│                                                      │
│              [Start Import]                          │
└─────────────────────────────────────────────────────┘
```

---

## Relevant Files

| File                                                                                                                                     | Changes                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ |
| **Backend**                                                                                                                              |                                                        |
| [backend/app/models/product.py](backend/app/models/product.py)                                                                           | Add `matches_item_id`                                  |
| [backend/app/schemas/product.py](backend/app/schemas/product.py)                                                                         | Add to schemas                                         |
| [backend/app/services/product_matching.py](backend/app/services/product_matching.py)                                                     | Direct item_id matching                                |
| [backend/app/api/routes/admin/agent.py](backend/app/api/routes/admin/agent.py)                                                           | New `/items` endpoint, `/jobs/item` endpoint           |
| `alembic/versions/xxx_add_matches_item_id.py`                                                                                            | Migration                                              |
| **Agent**                                                                                                                                |                                                        |
| [agent/search_terms.py](agent/search_terms.py)                                                                                           | NEW: search terms from translations                    |
| [agent/job_manager.py](agent/job_manager.py)                                                                                             | Add `item_id` to Job                                   |
| [agent/server.py](agent/server.py)                                                                                                       | New item-based scrape endpoint                         |
| [agent/main.py](agent/main.py)                                                                                                           | `scrape_by_item()` function                            |
| [agent/shops/base.py](agent/shops/base.py)                                                                                               | Add `search_language` property                         |
| **Frontend**                                                                                                                             |                                                        |
| [frontend/src/components/admin/types.ts](frontend/src/components/admin/types.ts)                                                         | Add `AgentItem`, update `AgentJob`, `AgentBulkProduct` |
| [frontend/src/api/admin/agent.ts](frontend/src/api/admin/agent.ts)                                                                       | Add `fetchAgentItems()`, `startItemImportJob()`        |
| [frontend/src/components/admin/product-import/ImportConfigForm.tsx](frontend/src/components/admin/product-import/ImportConfigForm.tsx)   | Replace category with item dropdown                    |
| [frontend/src/components/admin/product-import/ImportReviewTable.tsx](frontend/src/components/admin/product-import/ImportReviewTable.tsx) | Show `matches_item_id` column                          |
| [frontend/src/i18n/locales/de.json](frontend/src/i18n/locales/de.json)                                                                   | New translation keys                                   |
| [frontend/src/i18n/locales/en.json](frontend/src/i18n/locales/en.json)                                                                   | New translation keys                                   |

---

## Verification

1. **Migration**: `make dev` runs without error
2. **Search term generation**: All 89 `cl-*` items have search terms
3. **Scrape test**: `POST /scrape/item {shop: "bike-components", item_id: "cl-rain-jacket-gravel"}` returns products with `matches_item_id` set
4. **Matching test**: Plan gravel ride → `cl-rain-jacket-gravel` → shows only gravel rain jackets
5. **Fallback**: If no products for specific item, show nothing (clean — no wrong matches)

---

## Decisions

| Decision                               | Rationale                                                      |
| -------------------------------------- | -------------------------------------------------------------- |
| Search terms from English translations | Most shops support English; fall back to German per shop       |
| `matches_item_id` as nullable          | Existing products stay `null`, gradually migrated              |
| Tag products at import time            | No runtime guessing; matching is deterministic                 |
| Keep weather scoring                   | When multiple products match an item, pick best for conditions |
| Remove zone/category matching          | Clean break; no fallback to imprecise matching                 |

---

## Migration Path for Existing Products

1. Products with `matches_item_id = null` won't be shown (clean slate)
2. Re-run agent with new search-based import for each shop
3. Or manually tag high-value products via admin UI

---

## Further Considerations

1. **Should we auto-generate search_terms.py from translations.py?**
   - Recommendation: Yes — write a script that extracts names, keep in sync

2. **Rate limiting per shop?**
   - Recommendation: Yes — 2s delay between searches, configurable per shop

3. **How many products to keep per item?**
   - Recommendation: 3-5 best matches per item per shop, ranked by weather fit + price
