# BIKE-25: Protobuf Agent Communication

| Field            | Value      |
| ---------------- | ---------- |
| **ID**           | BIKE-25    |
| **Status**       | Planned    |
| **Created**      | 2026-03-18 |
| **Dependencies** | BIKE-19    |

## Description

Replace the HTTP/JSON communication between the backend and the agent service with gRPC and Protocol Buffers. The backend currently proxies admin panel requests to the agent via `httpx` (JSON over HTTP), including job creation, status polling, and SSE streaming for progress updates. This change introduces a shared `.proto` contract as the single source of truth, improving type safety, reducing payload sizes, and enforcing a strict API contract between the two services.

**Key constraint:** Only the **backend ↔ agent** (service-to-service) transport changes. The frontend continues to communicate with the backend via REST/JSON and SSE — no frontend changes required.

## Scope

### In scope

- Shared `.proto` file(s) defining all messages and service RPCs for backend–agent communication
- gRPC server in the agent service replacing existing FastAPI HTTP endpoints used by the backend
- gRPC client in the backend replacing `httpx` HTTP calls to the agent
- gRPC server-streaming RPC for job progress (replaces the backend→agent SSE polling; backend converts gRPC stream back to SSE for the frontend)
- Immediate removal of the agent's HTTP endpoints consumed by the backend (agent's `/shops`, `/categories`, `/jobs/*` routes)
- Updated Docker/infrastructure config for gRPC port exposure
- Agent health check via gRPC health checking protocol

### Out of scope

- Frontend API changes (REST/JSON + SSE to frontend is unchanged)
- Agent's internal extraction pipeline logic
- Authentication/authorization changes (backend still gates admin access; agent trusts backend calls)
- Database schema changes

## Services Affected

| Service     | Impact                                                                                                               |
| ----------- | -------------------------------------------------------------------------------------------------------------------- |
| **backend** | Replace `httpx` HTTP calls with gRPC client; convert gRPC responses to existing REST/JSON responses for the frontend |
| **agent**   | Add gRPC server; remove FastAPI entirely (gRPC health protocol replaces `/health` endpoint)                          |

## User Stories

- As a **developer**, I want a shared `.proto` contract between backend and agent, so that API changes are caught at compile time rather than at runtime.
- As a **developer**, I want gRPC codegen for Python in both services, so that request/response types are always in sync.
- As a **developer**, I want backend–agent communication to use binary Protobuf serialization, so that payloads are smaller and faster to parse.
- As an **admin user**, I want the scraping/extraction workflow to work exactly as before (start job, see progress, approve products), so that the transport change is invisible to me.
- As a **developer**, I want gRPC server-streaming for job progress, so that the backend receives real-time updates without polling or maintaining an SSE connection to the agent.

## Acceptance Criteria

- [ ] AC-1: A shared `proto/` directory at the repo root contains `.proto` files defining all agent service RPCs and messages.
- [ ] AC-2: The agent service exposes a gRPC server (default port 50051) implementing all defined RPCs: `GetShops`, `GetCategories`, `ListJobs`, `StartJob`, `StartUrlJob`, `StartExtractUrlJob`, `GetJob`, `StreamJobProgress`.
- [ ] AC-3: The backend's admin agent routes (`/api/admin/agent/*`) use a gRPC client instead of `httpx` HTTP calls. All existing REST responses to the frontend remain identical.
- [ ] AC-4: Job progress streaming uses gRPC server-streaming from agent → backend. The backend converts the gRPC stream into SSE events for the frontend (existing SSE contract unchanged).
- [ ] AC-5: All existing agent-related admin panel functionality works identically: start category job, start URL job, start extract-URL job, view job status, stream progress, approve import.
- [ ] AC-6: The agent's old HTTP endpoints (`/shops`, `/categories`, `/jobs`, `/jobs/urls`, `/jobs/extract-url`, `/jobs/{id}`, `/jobs/{id}/stream`) are removed.
- [ ] AC-7: Python gRPC stubs are generated from `.proto` files via a reproducible build step (e.g., `make proto` or script).
- [ ] AC-8: Health checking uses the gRPC health checking protocol (`grpc.health.v1.Health`). The backend returns 502 to the frontend when the agent gRPC service is unreachable.
- [ ] AC-9: All existing backend tests for admin agent routes pass with the gRPC transport.
- [ ] AC-10: `docker-compose.yml` exposes the agent's gRPC port and the backend's `AGENT_SERVICE_URL` config is replaced with a gRPC target (e.g., `AGENT_GRPC_TARGET`).

## Edge Cases

- EC-1: **Agent unavailable** — Backend gRPC client gets a connection error → returns HTTP 502 to frontend (same behavior as current `httpx.ConnectError` handling).
- EC-2: **Job stream disconnects mid-progress** — Backend should handle gRPC stream cancellation gracefully and close the SSE connection to the frontend with an error event.
- EC-3: **Large product payloads** — gRPC default max message size (4 MB) should be sufficient for extraction results; verify with max-size jobs (50 products).
- EC-4: **Proto schema evolution** — Adding new fields to `.proto` messages must not break existing clients (use Protobuf's forward/backward compatibility rules: don't reuse field numbers, don't change field types).
- EC-5: **Concurrent job streams** — Multiple admin users streaming different jobs simultaneously; each gRPC stream is independent.
- EC-6: **Agent restart during active job** — In-memory jobs are lost (existing behavior); backend should handle gRPC `NOT_FOUND` status for missing job IDs.

---

<!-- Appended by /architecture agent -->

## Tech Design

### Service Impact Map

```
Frontend:  No changes (REST/JSON + SSE unchanged)
Backend:   Replace httpx agent calls with gRPC client in 1 route file + config
Agent:     Add gRPC server module; remove FastAPI entirely (server.py deleted)
Shared:    New proto/ directory at repo root with .proto definitions + codegen script
Infra:     Dockerfile port change, Procfile.dev entry, Makefile proto target
```

### Communication Flow (After)

```
┌─────────────┐   REST/JSON + SSE   ┌─────────────┐   gRPC (HTTP/2)    ┌─────────────┐
│   Frontend   │ ─────────────────▶ │   Backend   │ ────────────────▶ │    Agent     │
│  (Vite SPA)  │   /api/admin/      │  (FastAPI)  │    :50051          │  (gRPC srv)  │
└─────────────┘   agent/*           └─────────────┘                    └─────────────┘
                                          │
                   SSE ◀── converted ◀── gRPC server-streaming
                   (to frontend)          (from agent)
```

The backend acts as a **protocol bridge**: it receives REST requests from the frontend, translates them into gRPC calls to the agent, and converts gRPC responses (including server-streaming) back into REST/JSON or SSE for the frontend.

### Shared Proto Contract

A new `proto/` directory at the repo root contains the service definition. Both backend and agent import generated stubs from this contract.

**File: `proto/agent.proto`**

Defines one gRPC service `AgentService` with these RPCs:

| RPC                  | Type             | Description                                |
| -------------------- | ---------------- | ------------------------------------------ |
| `GetShops`           | Unary            | Returns list of configured shops           |
| `GetCategories`      | Unary            | Returns list of available categories       |
| `ListJobs`           | Unary            | Returns all jobs (newest first)            |
| `StartJob`           | Unary            | Start a category-based scrape job          |
| `StartUrlJob`        | Unary            | Start a URL-based extraction job           |
| `StartExtractUrlJob` | Unary            | Start a single-URL extraction job          |
| `GetJob`             | Unary            | Get job details by ID                      |
| `StreamJobProgress`  | Server-streaming | Stream real-time progress events for a job |

**Key messages:** `ShopInfo`, `CategoryInfo`, `JobInfo`, `ProductItem`, `ProgressEvent`, `StartJobRequest/Response`, `StartUrlJobRequest/Response`, `StartExtractUrlRequest/Response`.

The `JobInfo` message includes a `oneof extra` field to handle the polymorphic extra data (e.g., `suggestedCategoryId` and `url` for extract-URL jobs).

### Agent-Side Changes

**New file: `agent/grpc_server.py`**
- Implements `AgentServiceServicer` (generated from proto)
- Each RPC method delegates to the same underlying functions (`run_category`, `run_urls`, `extract_single_url`, job_manager operations) — the business logic is unchanged
- `StreamJobProgress` subscribes to the job's progress queue (same mechanism as current SSE) and yields `ProgressEvent` messages over the gRPC stream
- Starts on port 50051 by default (configurable via `AGENT_GRPC_PORT` env var)
- Registers the gRPC Health service (`grpc.health.v1`)

**Modified: `agent/__main__.py`**
- Starts the gRPC server instead of (or alongside) the uvicorn HTTP server
- The gRPC server runs on asyncio using `grpcio` async API

**Removed: `agent/server.py`**
- Entire file deleted — all HTTP route handlers and the FastAPI app are replaced by `grpc_server.py`
- Health checking moves to the gRPC health protocol; no HTTP health endpoint needed
- Dependencies `fastapi`, `uvicorn`, and `sse-starlette` removed from `agent/pyproject.toml`

### Backend-Side Changes

**New file: `backend/app/services/agent_client.py`**
- Async gRPC client wrapping all calls to the agent's `AgentService`
- Methods: `get_shops()`, `get_categories()`, `list_jobs()`, `start_job()`, `start_url_job()`, `start_extract_url_job()`, `get_job()`, `stream_job_progress()`
- Connection management: creates a shared `grpc.aio.Channel` on startup, reuses across requests
- Error handling: catches `grpc.RpcError`, maps gRPC status codes to HTTP status codes (UNAVAILABLE → 502, NOT_FOUND → 404, INVALID_ARGUMENT → 400)

**Modified: `backend/app/api/routes/admin/agent.py`**
- Replace `_agent_get()` / `_agent_post()` httpx helpers with calls to the gRPC client service
- The `stream_agent_job` endpoint converts gRPC server-streaming responses into SSE events (same format as today)
- All Pydantic schemas, approval logic, and frontend-facing REST contracts remain identical

**Modified: `backend/app/config.py`**
- Replace `AGENT_SERVICE_URL` with `AGENT_GRPC_TARGET` (e.g., `localhost:50051`)

### Code Generation

A `make proto` target runs `grpc_tools.protoc` to generate Python stubs from `proto/agent.proto` into both services:
- `agent/generated/agent_pb2.py` + `agent/generated/agent_pb2_grpc.py`
- `backend/app/generated/agent_pb2.py` + `backend/app/generated/agent_pb2_grpc.py`

Both `generated/` directories are committed to the repo (no build-time dependency on protoc for running the services).

### New Dependencies

| Service    | Package                            | Purpose                            |
| ---------- | ---------------------------------- | ---------------------------------- |
| Agent      | `grpcio >= 1.60.0`                 | gRPC server runtime                |
| Agent      | `grpcio-health-checking >= 1.60.0` | Standard health check protocol     |
| Backend    | `grpcio >= 1.60.0`                 | gRPC client runtime                |
| Dev (both) | `grpcio-tools >= 1.60.0`           | Protobuf compiler + Python codegen |

### Tech Decisions

1. **gRPC over raw Protobuf-over-HTTP** — gRPC gives us streaming support, standard health checks, codegen, and an ecosystem of tooling. The complexity overhead is minimal for service-to-service communication.

2. **Server-streaming for progress (not bidirectional)** — Job progress is a one-way flow: agent → backend. Server-streaming is simpler and matches the use case exactly. The backend converts to SSE for the frontend.

3. **Generated stubs committed to repo** — Avoids requiring `protoc` at build/deploy time. The `make proto` target regenerates when the `.proto` file changes. Generated files are not hand-edited.

4. **Shared proto at repo root** — Both services import from a common definition, ensuring they can never drift. The `proto/` directory is the single source of truth.

5. **grpcio async API** — Both the agent (asyncio-based) and backend (FastAPI/asyncio) benefit from the async gRPC API, avoiding thread-pool overhead.

6. **Approval routes unchanged** — The `/approve` and `/approve-url` endpoints are backend-only (they write to the database). They don't call the agent, so they need no changes.

## Implementation Plan

See `project/plans/BIKE-25-plan.md`.

<!-- Appended by /qa agent -->
