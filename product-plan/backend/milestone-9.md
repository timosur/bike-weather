# Milestone 9: LLM Product Agent

## What

A locally-run Python script that uses an LLM to find cycling products from affiliate shops, extract structured data, and push them into the database via the admin bulk API. Designed to run on-demand or as a scheduled task.

## Files

- `agent/pyproject.toml` — Dependencies: httpx, pydantic, openai (or anthropic SDK), beautifulsoup4, markdownify
- `agent/config.py` — Settings: ADMIN_API_URL, ADMIN_TOKEN, LLM_MODEL, LLM_API_KEY, target shops/categories config
- `agent/main.py` — CLI entry point: `python -m agent --category "rain-gear" --shop "amazon"`
- `agent/scraper.py`:
  - `fetch_page(url) → html` — Fetch product listing pages via httpx
  - `extract_text(html) → markdown` — Convert relevant page content to markdown (strip nav, ads, etc.)
- `agent/extractor.py`:
  - `extract_products(text, category, shop) → list[ProductData]` — LLM call to extract structured product data from page text
  - ProductData: name, description, price, image_url, affiliate_url, category_slug, shop_name
  - Prompt instructs the LLM to extract: product name, price, key features as description, image URL, and affiliate link
- `agent/publisher.py`:
  - `publish_products(products, api_url, token) → BulkResult` — POST to /api/admin/products/bulk
  - `publish_with_review(products) → BulkResult` — Interactive mode: print products, ask for confirmation before publishing
- `agent/shops/` — Per-shop configuration:
  - `amazon.py` — Amazon search URL templates, CSS selectors for product listings, affiliate tag injection
  - `bike24.py` — (example additional shop)
  - Each shop module defines: search_url(query), listing_selector, product_page_selector

## How it works

1. **Search**: Build a search URL for the target shop + category (e.g. Amazon search for "cycling rain jacket")
2. **Fetch**: Download the search results page
3. **Extract**: Convert HTML to clean text, send to LLM with extraction prompt
4. **Structure**: LLM returns structured product data (JSON)
5. **Validate**: Pydantic validates the extracted data, flags incomplete items
6. **Review** (optional): In interactive mode, display extracted products for human review/editing
7. **Publish**: Push to backend via POST /api/admin/products/bulk

## Implementation guidelines

- **LLM provider agnostic**: Use a simple wrapper that supports both OpenAI and Anthropic APIs. Configure via env var.
- **Extraction prompt**: Be specific about output format (JSON array). Include few-shot examples for the expected structure. Ask the LLM to set `is_published: false` by default so products land as drafts.
- **Products land as drafts**: All LLM-imported products have `is_published=false`. Admin reviews and publishes via the admin API (or the interactive mode approves before publishing).
- **Affiliate links**: Inject affiliate tag into URLs where applicable (e.g. Amazon `?tag=your-affiliate-id`). Configure tags per shop.
- **Rate limiting**: Respect shop crawl policies. Add delays between page fetches. Set a proper User-Agent.
- **Idempotency**: The bulk API matches by `affiliate_url`, so running the agent multiple times for the same products updates rather than duplicates.
- **Error handling**: If the LLM returns unparseable JSON, retry once with a correction prompt. Log failures, don't crash the batch.
- **Interactive review mode**: `--review` flag pauses after extraction and prints a table of products. User can approve all, skip individual items, or edit fields before publishing.

## Tests

- `agent/tests/test_extractor.py`:
  - `test_extract_products_from_sample_text` — Given a known product page text, LLM returns expected product structure (use a recorded/mocked LLM response).
  - `test_extract_handles_malformed_llm_response` — Gracefully handles non-JSON LLM output.
  - `test_extract_validates_required_fields` — Products missing name or price are flagged/skipped.
- `agent/tests/test_publisher.py`:
  - `test_publish_calls_bulk_endpoint` — Verify correct HTTP call to /api/admin/products/bulk.
  - `test_publish_handles_api_error` — API 500 is logged, not raised.
  - `test_publish_returns_summary` — Created/updated/skipped counts are returned.
- `agent/tests/test_scraper.py`:
  - `test_fetch_page_returns_html` — Mock httpx returns sample HTML.
  - `test_extract_text_strips_navigation` — HTML-to-markdown removes nav, footer, ads.
- `agent/tests/test_shops.py`:
  - `test_amazon_search_url_format` — Generates correct Amazon search URL with affiliate tag.
  - `test_affiliate_tag_injection` — Affiliate tag is correctly appended to product URLs.

## Verify

- `python -m agent --category "rain-gear" --shop "amazon" --review` → fetches, extracts, shows products for review
- Approve → products appear in DB as drafts (is_published=false)
- Run admin API: publish products → visible on frontend /products page
- Run agent again for same products → updates existing (no duplicates)
- `pytest agent/tests/` passes all tests
