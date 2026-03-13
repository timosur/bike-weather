# BIKE-11: LLM Product Scraper

| Field            | Value                    |
| ---------------- | ------------------------ |
| **ID**           | BIKE-11                  |
| **Status**       | Deployed                 |
| **Created**      | 2024-01-01               |
| **Dependencies** | BIKE-4 (product catalog) |

## Description

Standalone LLM-powered agent that scrapes cycling product data from configured shop websites. Uses OpenAI and Anthropic models to extract structured product information from HTML. Publishes scraped products to the PostgreSQL database. Runs as a CLI tool with an HTTP server for admin proxy integration.

## Scope

Sub-features and areas covered:

- LLM product extraction using OpenAI and Anthropic models
- Shop configuration (base URLs, scraping rules, search URLs)
- HTML scraping and text extraction
- Structured product data extraction (name, price, image, affiliate URL, weather metadata)
- Product publishing to PostgreSQL via bulk endpoint
- Job management (queue, status tracking, progress)
- HTTP server for admin proxy integration (trigger jobs, check status, get results)
- Standalone CLI entry point

### Key Files

- `agent/main.py` — main scrape pipeline orchestration
- `agent/extractor.py` — LLM-based product data extraction
- `agent/scraper.py` — HTML fetching and text extraction
- `agent/publisher.py` — publish products to backend database
- `agent/job_manager.py` — job queue and status management
- `agent/server.py` — HTTP server for admin proxy
- `agent/config.py` — agent configuration
- `agent/shops/` — shop-specific configurations
- `agent/__main__.py` — CLI entry point

## Acceptance Criteria (Summary)

- Agent extracts product data (name, price, image, URL, weather metadata) from shop pages
- LLM extraction uses structured prompts for consistent output
- Products are published to the database with proper category and shop associations
- Job manager tracks scrape job status and progress
- HTTP server accepts requests from admin proxy to trigger and monitor jobs
- Agent handles rate limiting and error recovery during scraping

---

## Tech Design

_Retroactive — see `project/spec/architecture.md` and `project/spec/api.md`._

## QA Results

_No formal QA tracking for retroactive features._

## Deployment

_Deployed to production via ArgoCD. See release skill for version history._
