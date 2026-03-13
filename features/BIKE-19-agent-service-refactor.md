# BIKE-19: Agent Service Refactor

| Field            | Value                                     |
| ---------------- | ----------------------------------------- |
| **ID**           | BIKE-19                                   |
| **Status**       | Planned                                   |
| **Created**      | 2026-03-13                                |
| **Dependencies** | BIKE-11 (LLM Product Scraper), BIKE-4 (Product Catalog) |

## Description

Refactor the agent from a dual-mode CLI + HTTP service into a pure FastAPI microservice. Remove all publishing logic (the agent no longer writes to the database) and all CLI/interactive capabilities. The agent becomes a stateless extraction service: it receives scrape requests, fetches pages, runs LLM extraction, and returns structured product data. The backend remains responsible for persisting products on admin approval.

This simplifies the agent's responsibility to a single concern — **scrape and extract** — and removes the auth/publishing coupling between agent and backend.

## Scope

### In Scope

- Remove `publisher.py` entirely (publishing, `BulkResult`, `CATEGORY_ZONE_MAP`, `publish_products()`, `publish_with_review()`)
- Remove `__main__.py` CLI entry point and all CLI-related code in `main.py` (argparse, interactive prompts, Rich console output for CLI)
- Remove `run_seed.py` references or scripts that invoke the agent CLI
- Move `CATEGORY_ZONE_MAP` to the backend (product bulk import logic)
- Make `server.py` the sole entry point (`uvicorn agent.server:app`)
- Update `Dockerfile` entrypoint to run FastAPI server directly
- Remove `rich` dependency (only used for CLI tables)
- Clean up `config.py`: remove `admin_api_url`, `admin_token`, `admin_dev_email` settings (agent no longer calls backend)
- Update agent tests to reflect removed publisher/CLI code
- Update backend admin agent proxy routes if any endpoints change

### Out of Scope

- Changing the shop configuration pattern (stays in `agent/shops/`)
- Changing the job management system (stays in-memory in agent)
- Changing the LLM extraction logic
- Changing the scraper (Playwright/httpx)
- Changing the backend bulk import API
- Changing the frontend admin panel

## User Stories

- As the **backend service**, I want to call the agent via HTTP to trigger product extraction jobs, so that I don't need the agent to have database access or auth credentials.
- As an **admin user**, I want the same job management experience (start job → stream progress → review → approve), so that the refactor is invisible to me.
- As a **developer**, I want the agent to have a single entry point (FastAPI server), so that there's no confusion between CLI and server modes.
- As a **developer**, I want publishing logic to live only in the backend, so that auth and database concerns aren't duplicated across services.
- As a **DevOps operator**, I want a simpler agent container that just runs a FastAPI server, so that deployment is straightforward with no mode selection.

## Acceptance Criteria

- [ ] AC-1: `publisher.py` is deleted. No code in the agent imports from it.
- [ ] AC-2: `__main__.py` is deleted or reduced to only starting the FastAPI server.
- [ ] AC-3: All CLI-specific code is removed from `main.py` (argparse, interactive prompts, `console.input()`, Rich table display).
- [ ] AC-4: `main.py` retains `run_category()` and `run_urls()` as async functions callable by `server.py`, returning `list[ProductData]` without any publishing step.
- [ ] AC-5: `config.py` no longer contains `admin_api_url`, `admin_token`, or `admin_dev_email` settings.
- [ ] AC-6: `CATEGORY_ZONE_MAP` exists in the backend (e.g., in the product bulk import service or route) and is used during product creation.
- [ ] AC-7: Agent `Dockerfile` entrypoint runs `uvicorn agent.server:app` (no CLI mode).
- [ ] AC-8: `rich` is removed from `pyproject.toml` dependencies.
- [ ] AC-9: All existing agent HTTP endpoints (`/health`, `/shops`, `/categories`, `/jobs`, `/jobs/urls`, `/jobs/{id}`, `/jobs/{id}/stream`) continue to work as before.
- [ ] AC-10: Backend admin proxy routes (`/api/admin/agent/*`) continue to work without changes, or are updated if agent endpoints changed.
- [ ] AC-11: The approval flow (`POST /api/admin/agent/jobs/{id}/approve`) still works — backend reads extracted products from the agent job and bulk-imports them.
- [ ] AC-12: All existing agent tests pass (with publisher/CLI tests removed or updated).
- [ ] AC-13: The `run_category()` function no longer calls `publish_products()` — it returns extracted products only.

## Edge Cases

- EC-1: Agent is called without any LLM API key configured → should return a clear error in the job status, not crash.
- EC-2: Old CLI invocations (`python -m agent`) should either start the server or fail with a clear message, not silently do nothing.
- EC-3: Backend approval endpoint calls agent to get job results, but job has expired (1-hour TTL) → backend should handle gracefully with an error message.
- EC-4: `CATEGORY_ZONE_MAP` in backend must handle unknown category IDs gracefully (return `None` for zone).
- EC-5: Removing `rich` doesn't break logging — ensure `logger` (stdlib) is used throughout, not `console.print()`.

## Services Affected

| Service   | Changes                                                                 |
| --------- | ----------------------------------------------------------------------- |
| **Agent** | Remove publisher, CLI, rich; simplify to FastAPI-only extraction service |
| **Backend** | Absorb `CATEGORY_ZONE_MAP`; verify proxy routes still work            |

---

<!-- Appended by architecture skill -->

## Tech Design

### Service Impact Map

```
Agent:    Delete publisher.py, __main__.py CLI, Rich dependency
          Simplify main.py to extract-only functions
          Config cleanup (remove backend auth settings)
          Dockerfile → uvicorn entrypoint
Backend:  No new models, no new endpoints
          Absorb CATEGORY_ZONE_MAP into existing bulk import logic
          Existing proxy routes unchanged
Frontend: No changes (admin panel works exactly as before)
Database: No migrations needed
```

### Architecture After Refactor

```
┌─────────────────────────────────┐
│  Frontend Admin Panel (React)    │
└──────────────┬──────────────────┘
               │ POST /api/admin/agent/jobs
               │ GET  /api/admin/agent/jobs/{id}/stream
               │ POST /api/admin/agent/jobs/{id}/approve
               ▼
┌─────────────────────────────────┐
│ Backend (FastAPI)                │
│ /api/admin/agent/* proxy routes  │──────────────────────────┐
│ /api/admin/products/bulk         │                          │
│  └─ CATEGORY_ZONE_MAP lives here │                          │
└──────────────┬──────────────────┘                          │
               │ HTTP proxy                                   │
               ▼                                              │
┌──────────────────────────────────┐                          │
│ Agent (FastAPI — extract only)    │                          │
│                                   │                          │
│  server.py    → HTTP endpoints    │                          │
│  main.py      → run_category()    │                          │
│                 run_urls()         │                          │
│  scraper.py   → fetch + parse     │                          │
│  extractor.py → LLM extraction    │                          │
│  job_manager  → in-memory jobs    │                          │
│  shops/       → shop configs      │                          │
│                                   │                          │
│  ✗ No publisher                   │                          │
│  ✗ No CLI                         │                          │
│  ✗ No DB access                   │                          │
│  ✗ No backend auth credentials    │                          │
└───────────────────────────────────┘                          │
                                                               │
               On admin approval, backend reads                │
               extracted products from agent job ──────────────┘
               and bulk-imports to DB with zone mapping
```

### Key Design Decisions

**1. CATEGORY_ZONE_MAP → Backend only**

The backend already has a duplicate `CATEGORY_ZONE` dict in `products.py`. The agent currently imports `CATEGORY_ZONE_MAP` from `publisher.py` in `server.py` to build bulk payloads. After removing `publisher.py`:

- The agent returns raw `ProductData` (no zone enrichment).
- The backend applies zone mapping during `_bulk_import()`, which it already does today.
- One authoritative copy of the mapping, in the service that owns product creation.

This is the cleanest separation — the agent extracts data, the backend enriches and persists it.

**2. CATEGORY_MAP / ALL_CATEGORIES → Stay in agent**

These slug-to-ID mappings power the agent's `/categories` endpoint and job validation. The admin panel uses them (via backend proxy) to populate category dropdowns. Moving them would require an API change for no benefit. They stay in `main.py`.

**3. server.py payload building → Simplified**

Currently `server.py` converts `ProductData` → bulk payload using `_build_bulk_payload()` from `publisher.py`. After refactor:

- Jobs store raw `ProductData` objects (already the case).
- The `/jobs/{id}` endpoint returns products as extracted (name, description, URL, weather metadata).
- The backend's approval endpoint (`/api/admin/agent/jobs/{id}/approve`) already handles converting products to the `BulkProductItem` format and calling `_bulk_import()`. No change needed there.

**4. main.py cleanup — Extract-only functions**

`main.py` currently has `run_category(extract_only=True)` mode used by `server.py`. After refactor:

- Remove the `extract_only` parameter — extraction is the ONLY mode.
- Remove `publish_products()` calls and the `publish` path entirely.
- Remove `argparse`, `Rich` console output, `main()` CLI dispatcher, `_print_result()`.
- Keep: `run_category()`, `run_urls()`, `run_all()`, `_resolve_category_id()`, `_build_search_query()`, `CATEGORY_MAP`, `ALL_CATEGORIES`.

**5. __main__.py → Starts the server**

Instead of deleting `__main__.py`, repurpose it to start uvicorn programmatically. This means `python -m agent` still works but launches the FastAPI server instead of the CLI. Aligns with EC-2 (old invocations get a clear behavior).

**6. Config cleanup — Remove backend coupling**

Remove from `Settings`:
- `admin_api_url` (agent no longer calls backend)
- `admin_token` (no auth needed — agent is an internal service)
- `admin_dev_email` (dev bypass no longer relevant)

Keep: LLM settings (`llm_provider`, `llm_model`, `llm_api_key`), HTTP client settings (`request_timeout`, `request_delay`, `user_agent`).

### Files Changed

| File | Action | Details |
|------|--------|---------|
| `agent/publisher.py` | **Delete** | Entire file removed |
| `agent/main.py` | **Modify** | Remove CLI code (argparse, Rich, `main()`, `_print_result()`); remove `extract_only` param; remove publish calls |
| `agent/__main__.py` | **Modify** | Replace CLI dispatch with `uvicorn.run(agent.server:app)` |
| `agent/server.py` | **Modify** | Remove `_build_bulk_payload` import from publisher; return raw ProductData in job results |
| `agent/config.py` | **Modify** | Remove `admin_api_url`, `admin_token`, `admin_dev_email` |
| `agent/Dockerfile` | **Modify** | Change ENTRYPOINT to `uvicorn agent.server:app` |
| `agent/pyproject.toml` | **Modify** | Remove `rich` dependency |
| `agent/tests/test_publisher.py` | **Delete** | Tests for removed code |
| `backend/app/api/routes/admin/products.py` | **Verify** | Confirm `CATEGORY_ZONE` dict covers all categories (merge any missing from agent's map) |

### Dependencies

**Removed:**
- `rich` — no longer needed (CLI tables gone)

**No new dependencies added.**

### Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| `server.py` references to `publisher.py` break at import time | Delete imports first, then run tests to catch remaining references |
| Backend approval endpoint expects zone-enriched products from agent | Verify `_bulk_import()` in backend already applies `CATEGORY_ZONE` mapping independently — confirmed it does |
| `CATEGORY_ZONE` in backend is missing entries that agent's `CATEGORY_ZONE_MAP` has | Diff both maps and merge missing entries into backend before deleting agent copy |
| Old Kubernetes deployments may still send CLI args | Dockerfile ENTRYPOINT change ensures only server mode; review K8s manifests for command overrides |

<!-- Appended by QA skill -->

## QA Results

_To be filled by the QA skill._
