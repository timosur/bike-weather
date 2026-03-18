# Plan: BIKE-25 — Protobuf Agent Communication

> Status: Not Started
> Feature spec: [BIKE-25](../features/BIKE-25-protobuf-agent-communication.md)
> Created: 2026-03-18

## Phase 1: Backend Developer — Proto Definition & Code Generation

- [ ] Create `proto/agent.proto` with the `AgentService` service definition, all RPC methods, and all message types (mirroring current JSON schemas)
- [ ] Add `grpcio-tools` to both `agent/pyproject.toml` and `backend/pyproject.toml` as dev dependencies
- [ ] Add `grpcio` and `grpcio-health-checking` to `agent/pyproject.toml` as runtime dependencies
- [ ] Add `grpcio` to `backend/pyproject.toml` as a runtime dependency
- [ ] Create `scripts/generate_proto.sh` that runs `grpc_tools.protoc` and outputs stubs to `agent/generated/` and `backend/app/generated/` (with `__init__.py` files)
- [ ] Add `make proto` target to `Makefile` that runs the generation script
- [ ] Run `make proto` and verify generated stubs compile without errors
- [ ] **Checkpoint**: Manual verification — review `proto/agent.proto` for correctness against all current JSON request/response shapes. Verify generated Python files exist in both `agent/generated/` and `backend/app/generated/`.

## Phase 2: Backend Developer — Agent gRPC Server

- [ ] Create `agent/grpc_server.py` implementing `AgentServiceServicer` with all 8 RPC methods, delegating to existing business logic (`job_manager`, `run_category`, `run_urls`, `extract_single_url`, `get_shop`, `list_shops`, etc.)
- [ ] Implement `StreamJobProgress` RPC using the existing `job.subscribe()` queue mechanism to yield `ProgressEvent` messages
- [ ] Register gRPC Health service (`grpc.health.v1`) on the server
- [ ] Add `AGENT_GRPC_PORT` setting to `agent/config.py` (default: `50051`)
- [ ] Update `agent/__main__.py` to start the gRPC server (asyncio-based) instead of the uvicorn HTTP server
- [ ] Verify the gRPC server starts successfully on port 50051 with `python -m agent`
- [ ] **Checkpoint**: Manual verification — start the agent with `python -m agent`, use `grpcurl` or a test script to call `GetShops` and `GetCategories` RPCs and confirm correct responses.

## Phase 3: Backend Developer — Backend gRPC Client

- [ ] Create `backend/app/services/agent_client.py` with an async gRPC client class wrapping all `AgentService` RPCs
- [ ] Implement gRPC error → HTTP error mapping (UNAVAILABLE → 502, NOT_FOUND → 404, INVALID_ARGUMENT → 400)
- [ ] Implement `stream_job_progress()` method that returns an async iterator of progress events
- [ ] Replace `AGENT_SERVICE_URL` with `AGENT_GRPC_TARGET` in `backend/app/config.py` (default: `localhost:50051`)
- [ ] Rewrite `backend/app/api/routes/admin/agent.py`: replace `_agent_get()`/`_agent_post()` with calls to the gRPC client
- [ ] Rewrite the `stream_agent_job` SSE endpoint to iterate over the gRPC server-streaming response and convert each `ProgressEvent` to an SSE event (same JSON format as today)
- [ ] Remove the `httpx` import and `AGENT_TIMEOUT` constant from `agent.py` route file
- [ ] Verify all existing frontend-facing REST response shapes are unchanged by comparing with current outputs
- [ ] **Checkpoint**: Manual verification — start both backend and agent, use the admin panel to start a scrape job, verify progress streams and job results appear correctly in the frontend.

## Phase 4: Backend Developer — Agent Cleanup & Infrastructure

- [ ] Delete `agent/server.py` entirely (all HTTP routes replaced by gRPC)
- [ ] Remove `fastapi`, `uvicorn`, and `sse-starlette` from `agent/pyproject.toml`
- [ ] Update `agent/Dockerfile` entrypoint to start the gRPC server instead of uvicorn
- [ ] Update `Procfile.dev` agent entry to start the gRPC server
- [ ] Update `.env.example` (if exists) — replace `AGENT_SERVICE_URL` with `AGENT_GRPC_TARGET`
- [ ] **Checkpoint**: Manual verification — run `make dev`, confirm the agent starts as a gRPC server, backend connects via gRPC, admin panel scraping workflow works end-to-end.

## Phase 5: Backend Developer — Tests & Documentation

- [ ] Update or create backend tests for admin agent routes that mock the gRPC client instead of httpx
- [ ] Update agent tests if any directly test HTTP endpoints (replace with gRPC client tests or servicer unit tests)
- [ ] Run `make test-backend` — all tests pass
- [ ] Run `make test-agent` — all tests pass
- [ ] Update `project/ARCHITECTURE.md` — change the Service Communication diagram and Agent service description to reflect gRPC
- [ ] Update `.github/instructions/agent.instructions.md` — reflect that the agent now uses gRPC, not FastAPI HTTP
- [ ] **Checkpoint**: Manual verification — full walkthrough: start category job, start URL job, start extract-URL job, view progress stream, approve import. All work identically to before.
