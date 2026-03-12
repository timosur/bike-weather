# BIKE-17: Test Contracts & CI Hardening

| Field            | Value      |
| ---------------- | ---------- |
| **ID**           | BIKE-17    |
| **Status**       | Planned    |
| **Created**      | 2025-01-01 |
| **Dependencies** | None       |

## Description

Three defense layers to harden the test suite and prevent agentic "cheating" (modifying tests to match broken code): CI test gating on PRs, schema-driven API contracts (OpenAPI snapshot → generated TypeScript types → typed E2E mocks), and structural guardrails for AI agents.

## User Stories

### US-1: CI Test Gating

**As a** developer, **I want** CI to run all tests on every PR to `main`, **so that** broken code cannot be merged and deployed.

**Acceptance Criteria:**

- [ ] Backend CI workflow runs `uv run pytest` on PRs to `main`
- [ ] Frontend CI workflow runs `tsc --noEmit` and `npx playwright test` on PRs to `main`
- [ ] Agent CI workflow runs `uv run pytest` on PRs to `main`
- [ ] Test jobs are separate from build/push jobs (build/push still only runs on tags)
- [ ] PR merge is blocked if any test job fails (requires branch protection setup)

### US-2: OpenAPI Contract Snapshot

**As a** developer, **I want** an OpenAPI snapshot that is the single source of truth for the API contract, **so that** any schema change is explicitly tracked and reviewed.

**Acceptance Criteria:**

- [ ] Backend test `test_openapi_contract.py` compares live OpenAPI spec against committed snapshot
- [ ] Snapshot lives at `backend/tests/snapshots/openapi.json` and is committed to the repo
- [ ] Test failure message says: "API contract changed. Run `make update-api-contract` to update."
- [ ] `make update-api-contract` exports the OpenAPI spec and regenerates frontend types in one command
- [ ] Helper script `scripts/export-openapi.py` creates a test ASGI client and writes the spec to the snapshot file

### US-3: Generated Frontend Types

**As a** frontend developer, **I want** TypeScript API types auto-generated from the OpenAPI snapshot, **so that** frontend types stay in sync with the backend schema without manual maintenance.

**Acceptance Criteria:**

- [ ] `openapi-typescript` is installed as a frontend dev dependency
- [ ] `npm run generate:api-types` generates `frontend/src/api/generated-types.ts` from the snapshot
- [ ] Generated types file is committed to the repo (not gitignored)
- [ ] CI step re-generates types and runs `git diff --exit-code src/api/generated-types.ts` to detect drift
- [ ] E2E mock factories in `frontend/e2e/fixtures/api-responses.ts` are typed against generated schema types
- [ ] `tsc --noEmit` catches any mock/schema drift

### US-4: Agent↔Backend Contract

**As a** developer, **I want** the agent's product publish payload validated against the backend's schema, **so that** field renames or type changes are caught before deployment.

**Acceptance Criteria:**

- [ ] `agent/tests/test_contract.py` validates a sample `ProductData` dict against the OpenAPI snapshot's bulk request schema
- [ ] Test uses `jsonschema.validate()` against the schema extracted from the snapshot
- [ ] Test fails if agent's `ProductData` fields don't match the backend's expected request shape
- [ ] Test covers required fields, optional fields, and field types

### US-5: Test Modification Detection

**As a** reviewer, **I want** PRs that modify test files to be flagged automatically, **so that** test contract weakening is visible and reviewed carefully.

**Acceptance Criteria:**

- [ ] New workflow `.github/workflows/test-guard.yml` triggers on PRs to `main`
- [ ] Detects changes in `*/tests/**`, `e2e/**`, `**/snapshots/**`
- [ ] Posts a PR comment listing changed test files with a warning: "⚠️ This PR modifies test files. Please review test changes carefully to ensure contracts are not being weakened."
- [ ] Does not block the PR — informational only

### US-6: Agent Coding Guardrails

**As a** project maintainer, **I want** explicit rules in copilot-instructions.md about test contracts, **so that** AI agents follow contract discipline when modifying tests.

**Acceptance Criteria:**

- [ ] New "Testing Contracts" subsection added to `.github/copilot-instructions.md` under Conventions
- [ ] Rules state: fix implementation code when tests fail, not the tests
- [ ] Rules define when test modification is acceptable: new test cases, genuine test bugs, intentional contract changes
- [ ] Rules prohibit weakening assertions (removing fields, loosening operators, reducing assertion count)
- [ ] Rules require explaining contract changes in commit messages when updating the OpenAPI snapshot

## Edge Cases

- OpenAPI snapshot has non-deterministic ordering → use sorted JSON output for consistent snapshots
- Frontend type generation fails due to unsupported OpenAPI constructs → document workarounds, pin `openapi-typescript` version
- Agent tests import from backend package → use snapshot JSON validation instead of direct Python imports (separate packages)
- Test-guard workflow PR comment is rate-limited by GitHub API → use `actions/github-script` with proper error handling
- Existing hand-written frontend types conflict with generated types → gradual migration (follow-up, not blocking)

## Scope

### Phase 1: CI Test Gating

- Modify `.github/workflows/backend.yml` — add test job on PRs
- Modify `.github/workflows/frontend.yml` — add test + type-check jobs on PRs
- Modify `.github/workflows/agent.yml` — add test job on PRs

### Phase 2: Schema-Driven API Contracts

- New `backend/tests/test_openapi_contract.py` — OpenAPI snapshot test
- New `backend/tests/snapshots/openapi.json` — committed API schema snapshot
- New `frontend/src/api/generated-types.ts` — auto-generated TypeScript types
- New `agent/tests/test_contract.py` — agent↔backend payload contract test
- Modify `frontend/package.json` — add `openapi-typescript` dep + generate script
- Modify `frontend/e2e/fixtures/api-responses.ts` — type all mock factories against generated types
- New `scripts/export-openapi.py` — OpenAPI export helper
- Modify `Makefile` — add `update-api-contract` target

### Phase 3: Structural Guardrails

- Modify `.github/copilot-instructions.md` — add Testing Contracts subsection
- New `.github/workflows/test-guard.yml` — PR test-modification detector

### Key Files (New)

- `backend/tests/test_openapi_contract.py`
- `backend/tests/snapshots/openapi.json`
- `frontend/src/api/generated-types.ts`
- `agent/tests/test_contract.py`
- `scripts/export-openapi.py`
- `.github/workflows/test-guard.yml`

### Key Files (Modified)

- `.github/workflows/backend.yml`
- `.github/workflows/frontend.yml`
- `.github/workflows/agent.yml`
- `.github/copilot-instructions.md`
- `frontend/package.json`
- `frontend/e2e/fixtures/api-responses.ts`
- `Makefile`

---

## Tech Design

_See `plans/test-contracts.md` for the full 3-phase implementation plan with verification steps._

## QA Results

_Not yet tested._

## Deployment

_Not yet deployed._
