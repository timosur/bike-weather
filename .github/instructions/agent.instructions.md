---
applyTo: "agent/**"
---

# Agent Instructions

## Structure

The agent is an LLM-powered product scraper that extracts cycling product data from configured shops and returns structured data via HTTP.

- `agent/server.py` — FastAPI HTTP server (sole entry point)
- `agent/main.py` — Core extraction pipeline (`run_category()`, `run_urls()`)
- `agent/scraper.py` — Web scraping logic
- `agent/extractor.py` — LLM-based product data extraction (OpenAI + Anthropic)
- `agent/config.py` — Configuration
- `agent/job_manager.py` — Job orchestration
- `agent/shops/` — Shop-specific configurations

## Patterns

- **LLM extraction** uses both OpenAI and Anthropic models — check which is used for what before adding new logic
- **Shop configuration** is per-shop — each shop has specific selectors and extraction rules in `agent/shops/`
- **No publishing** — the agent is a stateless extraction service; the backend handles persistence on admin approval
- **HTTP server** exposes extraction job endpoints consumed by the backend admin proxy

## Testing

```bash
cd agent && uv run pytest                          # all tests
cd agent && uv run pytest tests/test_file.py       # single file
```

- `asyncio_mode = "auto"` — test functions can be `async def` without decorators
