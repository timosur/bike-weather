# Plan: Harden Tests as Agentic Contracts

## Problem

In agentic development, AI agents can "cheat" by modifying tests to match broken code instead of fixing the code to match tests. The current bike-weather test suite has several gaps:

1. **No CI test gating** — CI only builds Docker images on tags. Tests never run in CI, so broken code can be deployed.
2. **No shared API contract** — Frontend types are hand-written copies of backend Pydantic schemas. E2E mock fixtures are plain objects with no type enforcement. Backend can change a response shape without frontend tests catching it.
3. **Weak agent guardrails** — Instructions say "don't disable tests" but nothing prevents an agent from subtly changing assertions or mock data.
4. **No agent↔backend contract** — The agent's `publish_products()` call has no schema-level validation against the backend's bulk endpoint.

## Approach

Three defense layers: (A) CI gating, (B) schema-driven contracts, (C) structural guardrails for agents.

## Confirmed Decisions

- **CI trigger**: PRs to `main` only (not every push)
- **OpenAPI snapshot**: Single `openapi.json` file
- **Type generation**: `openapi-typescript`
- **E2E mock strictness**: Strict — all mock factories typed against generated types upfront
- **Test modification detection**: PR comment listing changed test files
- **Makefile integration**: Yes — `make update-api-contract`
- **Agent contract test**: Yes — validate publish payload against backend Pydantic model

---

## Steps

### Phase 1: CI Test Gating (blocks deployment of broken code)

**1.1** Add a `test` job to each CI workflow, triggered on PRs to `main`:

- `backend.yml`: `uv sync` → `uv run pytest`
- `frontend.yml`: `npm ci` → `npx tsc --noEmit` → `npx playwright install --with-deps chromium` → `npx playwright test`
- `agent.yml`: `uv sync` → `uv run pytest`
- Each workflow needs a new `on.pull_request` trigger (`branches: [main]`) alongside the existing `on.push.tags` trigger
- The build/push job keeps its `if: startsWith(github.ref, 'refs/tags/')` guard so it only runs on tags
- Files: `.github/workflows/backend.yml`, `.github/workflows/frontend.yml`, `.github/workflows/agent.yml`

**1.2** Enable branch protection on `main` requiring the test jobs to pass before merge.

- GitHub repo Settings → Branches → `main` → Require status checks. Manual step.

### Phase 2: Schema-Driven API Contracts (prevents mock drift)

**2.1** Add an OpenAPI snapshot test to the backend:

- New test: `backend/tests/test_openapi_contract.py`
  - Uses `async_client` to `GET /openapi.json`
  - Loads `backend/tests/snapshots/openapi.json` from disk
  - Compares via `json.loads()` + `==` (or `deepdiff` for readable diffs)
  - Provides a clear failure message: "API contract changed. Run `make update-api-contract` to update."
- New snapshot: `backend/tests/snapshots/openapi.json` — generated once, committed
- Reference: use same `async_client` fixture from `conftest.py`

**2.2** Install `openapi-typescript` and add generation script:

- `npm install -D openapi-typescript` in `frontend/`
- Add script to `frontend/package.json`: `"generate:api-types": "openapi-ts ../backend/tests/snapshots/openapi.json -o src/api/generated-types.ts"`
- Generated file: `frontend/src/api/generated-types.ts` — committed to repo, not gitignored
- Add CI step in `frontend.yml`: re-generate types and `git diff --exit-code src/api/generated-types.ts` to ensure they're up to date

**2.3** Type all E2E mock fixtures strictly:

- Import generated response types into `frontend/e2e/fixtures/api-responses.ts`
- Annotate every factory return type (e.g., `mockRideReport(): components["schemas"]["RideReportResponse"]`)
- `tsc --noEmit` in CI catches any drift between mocks and the real schema
- All ~25 factory functions must be typed in one pass (strict approach)

**2.4** Add agent↔backend contract test:

- New test in `agent/tests/test_contract.py`
- Import `ProductData` from `agent.extractor` and the backend's bulk endpoint Pydantic schema
- Since agent and backend are separate packages, approach: validate a sample `ProductData` dict against the backend's expected request schema (extract from OpenAPI snapshot JSON, or use a shared JSON Schema)
- Alternatively: load `backend/tests/snapshots/openapi.json`, extract the `BulkProductRequest` (or equivalent) schema, and validate `ProductData.model_dump()` against it using `jsonschema.validate()`
- This catches field renames, type changes, or missing required fields

**2.5** Gradually migrate hand-written frontend API types to re-export generated types:

- Files in `frontend/src/api/*.ts` and component `types.ts` files
- Incremental follow-up — not blocking for the core contract enforcement

### Phase 3: Structural Guardrails for Agents

**3.1** Add explicit test contract rules to `.github/copilot-instructions.md` under a new `### Testing Contracts` subsection in the Conventions section:

```markdown
- Test files are contracts. When a test fails, fix the implementation code, not the test.
- Only modify test files when: (a) adding new test cases for new features, (b) fixing a genuine test bug, or (c) intentionally changing the API contract (which requires updating the OpenAPI snapshot first via `make update-api-contract`).
- Never weaken assertions (e.g., removing fields from expected responses, loosening comparison operators, reducing assertion count).
- When changing the OpenAPI snapshot, explain the contract change in the commit message.
- The OpenAPI snapshot is the single source of truth for API contracts. Frontend types and E2E mocks are generated/typed from it.
```

**3.2** Add CI test-modification detector as a new workflow:

- New file: `.github/workflows/test-guard.yml`
- Triggers on PRs to `main`
- Uses `tj-actions/changed-files` or `git diff` to detect changes in `*/tests/**`, `e2e/**`, `**/snapshots/**`
- Posts a PR comment via `actions/github-script` listing the changed test files with a note: "⚠️ This PR modifies test files. Please review test changes carefully to ensure contracts are not being weakened."

**3.3** Add `make update-api-contract` Makefile target:

- Chains: (1) start backend in test mode / use pytest to export openapi.json → (2) copy to `backend/tests/snapshots/openapi.json` → (3) `cd frontend && npm run generate:api-types`
- Practically: a pytest fixture or small script that runs the FastAPI app, fetches `/openapi.json`, writes to snapshots dir
- Add helper script: `scripts/export-openapi.py` — creates a test ASGI client, fetches the spec, writes to file
- File: root `Makefile`, `scripts/export-openapi.py`

---

## Relevant Files

### Modified

- `.github/workflows/backend.yml` — add test job on PRs
- `.github/workflows/frontend.yml` — add test + type-check jobs on PRs
- `.github/workflows/agent.yml` — add test job on PRs
- `.github/copilot-instructions.md` — add Testing Contracts subsection
- `frontend/package.json` — add `openapi-typescript` dep + script
- `frontend/e2e/fixtures/api-responses.ts` — type all mock factories
- `Makefile` — add `update-api-contract` target

### New

- `backend/tests/test_openapi_contract.py` — OpenAPI snapshot test
- `backend/tests/snapshots/openapi.json` — committed API schema snapshot
- `frontend/src/api/generated-types.ts` — auto-generated TypeScript types (committed)
- `agent/tests/test_contract.py` — agent↔backend payload contract test
- `.github/workflows/test-guard.yml` — PR test-modification detector
- `scripts/export-openapi.py` — OpenAPI export helper

## Verification

1. **Phase 1**: Create a PR with a deliberately failing test → CI must block merge
2. **Phase 2.1**: Change a backend response field (e.g., rename a key in a Pydantic model) without updating snapshot → `test_openapi_contract` fails in CI
3. **Phase 2.2**: Update snapshot but don't regenerate TS types → CI `git diff --exit-code` step fails
4. **Phase 2.3**: Update snapshot + regenerate types but don't update E2E mocks → `tsc --noEmit` fails on type mismatch in `api-responses.ts`
5. **Phase 2.4**: Change agent's `ProductData` fields to not match backend schema → `test_contract.py` fails
6. **Phase 3.2**: Modify any test file in a PR → bot comment appears listing changed files
7. **End-to-end**: Full contract change workflow: update Pydantic model → `make update-api-contract` → update E2E mocks → all CI passes

## Scope

- **Included**: CI gating, OpenAPI snapshot, type generation, E2E mock typing, agent contract test, copilot instructions, test-mod detector, Makefile target
- **Excluded**: Pact contract testing, property-based testing, load testing, full hand-written type migration (follow-up), integration E2E against real backend
