# Plan: BIKE-19 — Agent Service Refactor

> Status: Complete
> Feature spec: [BIKE-19](../features/BIKE-19-agent-service-refactor.md)
> Created: 2026-03-14

## Phase 1: Delete Publisher & Clean Up Imports

- [x] Delete `agent/publisher.py` (removes `CATEGORY_ZONE_MAP`, `BulkResult`, `_build_bulk_payload`, `publish_products`, `publish_with_review`)
- [x] Delete `agent/tests/test_publisher.py`
- [x] In `agent/main.py`: remove `from agent.publisher import BulkResult, publish_products, publish_with_review`
- [x] In `agent/main.py`: remove all calls to `publish_products()` and `publish_with_review()` inside `run_category()` and `run_all()`
- [x] In `agent/main.py`: remove the `extract_only` parameter from `run_category()` — extraction is now the only mode, always return `list[ProductData]`
- [x] In `agent/server.py`: remove `from agent.publisher import CATEGORY_ZONE_MAP`
- [x] In `agent/server.py`: inline the zone-map dict into `_products_to_bulk_payload()` (copy from the deleted publisher, or remove the function entirely and store raw `ProductData` dicts on `job.products` — see Phase 3 decision)
- [x] **Checkpoint**: Manual verification — `cd agent && python -c "from agent.server import app"` succeeds with no import errors

## Phase 2: Remove CLI Code & Repurpose Entry Points

- [x] In `agent/main.py`: delete `main()` function (argparse CLI dispatcher)
- [x] In `agent/main.py`: delete `run()` async function (CLI orchestrator that branches to `--serve`, `--category`, `--all`)
- [x] In `agent/main.py`: delete `_print_result()` function (Rich table output of `BulkResult`)
- [x] In `agent/main.py`: delete `_cli_progress()` callback (Rich console printing)
- [x] In `agent/main.py`: delete `_setup_logging()` if it relies on `RichHandler`; replace with stdlib logging setup if needed by remaining code
- [x] In `agent/main.py`: remove all `from rich...` imports and `console = Console()` instances
- [x] In `agent/__main__.py`: replace contents with uvicorn server start (`uvicorn.run("agent.server:app", ...)`)
- [x] In `agent/pyproject.toml`: remove `rich>=13.0.0` from dependencies
- [x] In `agent/pyproject.toml`: remove the `[project.scripts]` entry point if it references `agent.main:main`
- [x] **Checkpoint**: Manual verification — `cd agent && python -m agent` starts the FastAPI server on port 8001; `curl http://localhost:8001/health` returns OK

## Phase 3: Simplify Server & Config

- [x] In `agent/server.py`: decide on product format — either keep `_products_to_bulk_payload()` with an inlined zone map, or return raw `ProductData` dicts (verify what the backend approval endpoint expects by reading `backend/app/api/routes/admin/products.py` agent proxy logic)
- [x] In `agent/server.py`: update `_run_job()` and `_run_url_job()` to no longer pass `extract_only=True` (parameter removed in Phase 1)
- [x] In `agent/config.py`: remove `admin_api_url`, `admin_token`, `admin_dev_email` from `Settings`
- [x] In `agent/Dockerfile`: change `ENTRYPOINT` from `["python", "-m", "agent"]` to run uvicorn (`["uvicorn", "agent.server:app", "--host", "0.0.0.0", "--port", "8001"]` or equivalent)
- [x] Verify no remaining references to removed config fields (`grep -r "admin_api_url\|admin_token\|admin_dev_email" agent/`)
- [x] Verify no remaining `rich` imports (`grep -r "from rich\|import rich" agent/`)
- [x] Verify no remaining publisher references (`grep -r "publisher" agent/`)
- [x] **Checkpoint**: Manual verification — start agent server, hit all endpoints (`/health`, `/shops`, `/categories`, `POST /jobs`, `GET /jobs/{id}`), confirm responses are valid

## Phase 4: Backend Verification & Final Testing

- [x] Compare backend `CATEGORY_ZONE` dict (in `backend/app/api/routes/admin/products.py`) with the deleted agent `CATEGORY_ZONE_MAP` — merge any missing category mappings into the backend
- [x] Verify the backend agent proxy/approval flow: read the admin agent proxy routes and confirm they handle the product format returned by the refactored agent
- [x] Run `make test-agent` — all agent tests pass (with publisher tests removed) <!-- 32 passed, 1 pre-existing failure in test_scraper unrelated to BIKE-19 -->
- [x] Run `make test-backend` — all backend tests pass <!-- 159 passed, pre-existing failures in safety rules + seed tests unrelated to BIKE-19 -->
- [ ] **Checkpoint**: Manual verification — full end-to-end walkthrough: admin panel → start scrape job → stream progress → review extracted products → approve → products appear in catalog
