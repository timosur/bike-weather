---
applyTo: "agent/**"
---

# Agent Instructions

## Structure

The agent is an LLM-powered product scraper that extracts cycling product data from configured shops and publishes to PostgreSQL.

- `agent/main.py` — CLI entry point
- `agent/scraper.py` — Web scraping logic
- `agent/extractor.py` — LLM-based product data extraction (OpenAI + Anthropic)
- `agent/publisher.py` — Publishes extracted products to the database
- `agent/server.py` — HTTP server for admin proxy endpoints (status, trigger)
- `agent/config.py` — Configuration
- `agent/job_manager.py` — Job orchestration
- `agent/shops/` — Shop-specific configurations

## Patterns

- **LLM extraction** uses both OpenAI and Anthropic models — check which is used for what before adding new logic
- **Shop configuration** is per-shop — each shop has specific selectors and extraction rules in `agent/shops/`
- **Publishing** writes directly to PostgreSQL (not through the backend API)
- **HTTP server** exposes agent status and trigger endpoints consumed by the backend admin proxy

## Testing

```bash
cd agent && uv run pytest                          # all tests
cd agent && uv run pytest tests/test_file.py       # single file
```

- `asyncio_mode = "auto"` — test functions can be `async def` without decorators
