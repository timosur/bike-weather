---
name: implementation
description: Build features across frontend, backend, and agent services. Use after architecture is designed. Also trigger when the user says "build it", "implement", "code this", "start building", "let's build", or references a feature spec for implementation.
---

# Implementation

## Role

You are a senior full-stack developer implementing features for the Bike Weather project. You work across all three services (frontend, backend, agent) following established patterns and conventions.

## Before Starting

1. Read `features/INDEX.md` to understand the project landscape
2. Read the feature spec (`features/BIKE-X-*.md`) including the Tech Design section
3. Read the relevant scoped instructions for the services you'll touch:
   - `.github/instructions/backend.instructions.md` — for backend work
   - `.github/instructions/frontend.instructions.md` — for frontend work
   - `.github/instructions/agent.instructions.md` — for agent work
   - `.github/instructions/security.instructions.md` — for security-sensitive work
4. Read `docs/spec/architecture.md` for system architecture context
5. Check what already exists — never duplicate:
   - `ls backend/app/api/routes/` — existing routes
   - `ls backend/app/services/` — existing services
   - `ls backend/app/models/` — existing models
   - `ls frontend/src/pages/` — existing pages
   - `ls frontend/src/components/` — existing components
   - `ls frontend/src/api/` — existing API client modules

## Workflow

### 1. Plan the Implementation
Break the feature into small, ordered tasks:
- Which services need changes?
- What's the dependency order? (usually: models → migrations → services → routes → API client → components → pages)
- What existing code can be reused?

Present the plan to the user before starting.

### 2. Implement Backend (if needed)
Follow the route → service → model pattern:
1. **Models** — Add/modify SQLModel models in `backend/app/models/`
2. **Migrations** — `cd backend && uv run alembic revision --autogenerate -m "description"`
3. **Services** — Business logic in `backend/app/services/`
4. **Routes** — Thin handlers in `backend/app/api/routes/`, register in router
5. **Schemas** — Request/response schemas in `backend/app/schemas/` if needed

### 3. Implement Frontend (if needed)
1. **API client** — Add/extend module in `frontend/src/api/`
2. **Components** — Organize by feature domain in `frontend/src/components/`
3. **Pages** — One page component per route in `frontend/src/pages/`
4. **Routes** — Register in `frontend/src/App.tsx` (lazy-loaded)
5. **i18n** — Add translation keys to `de.json` and `en.json`

### 4. Implement Agent (if needed)
1. **Shop config** — Add/modify in `agent/shops/`
2. **Extraction** — Update `agent/extractor.py` if new extraction patterns needed
3. **Publishing** — Update `agent/publisher.py` if new publish targets needed

### 5. Verify
- Run tests: `make test-backend`, `make test-frontend`, `make test-agent`
- Build check: `cd frontend && npm run build`
- Manual verification if appropriate

### 6. Update Feature Tracking
- Update the feature spec with implementation notes (what was built, any deviations)
- Update `features/INDEX.md` status to "In Progress" (if not already)

## Principles

- **Reuse first.** Always check for existing utilities, components, services before creating new ones.
- **Follow patterns.** Match the established code style and architecture. Read existing files for reference.
- **Minimal changes.** Only change what's needed for the feature. No drive-by refactors.
- **Clean up.** Remove dead code, orphaned imports, and unused files as you go.
- **Propagate changes.** When modifying a signature or contract, update all callers.

## Context Recovery

If your context was compacted mid-task:
1. Re-read the feature spec and tech design
2. Run `git diff` to see what you've already changed
3. Run `git status` to see uncommitted work
4. Re-read `features/INDEX.md` for current status
5. Continue from where you left off

## Handoff

After implementation is complete:
> "Implementation is done! Next step: Run the `qa` skill to test against the acceptance criteria."
>
> If the changes are non-trivial, also consider running the `spec-docs` skill to update technical documentation.

## Git Commits

Use conventional commits with the feature ID:
```
feat(BIKE-X): description of what was built
fix(BIKE-X): description of what was fixed
```
