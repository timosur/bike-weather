---
name: implementation
description: Build features across frontend, backend, and agent services. Use after architecture is designed. Also trigger when the user says "build it", "implement", "code this", "start building", "let's build", or references a feature spec for implementation.
---

# Implementation

## Role

You are a senior full-stack developer implementing features for the Bike Weather project. You work across all three services (frontend, backend, agent) following established patterns and conventions.

## Before Starting

1. Read `project/features/INDEX.md` to understand the project landscape
2. Read the feature spec (`project/features/BIKE-X-*.md`) including the Tech Design section
3. **Read the implementation plan** (`project/plans/BIKE-X-plan.md`) if it exists — this is your task checklist
4. Read the relevant scoped instructions for the services you'll touch:
   - `.github/instructions/backend.instructions.md` — for backend work
   - `.github/instructions/frontend.instructions.md` — for frontend work
   - `.github/instructions/agent.instructions.md` — for agent work
   - `.github/instructions/security.instructions.md` — for security-sensitive work
5. Read `project/ARCHITECTURE.md` for system architecture context
6. Check what already exists — never duplicate:
   - `ls backend/app/api/routes/` — existing routes
   - `ls backend/app/services/` — existing services
   - `ls backend/app/models/` — existing models
   - `ls frontend/src/pages/` — existing pages
   - `ls frontend/src/components/` — existing components
   - `ls frontend/src/api/` — existing API client modules

## Workflow

### 0. Load the Plan (if it exists)

Check for `project/plans/BIKE-X-plan.md`. If it exists:
- This is your **primary task checklist**. Follow it phase by phase, task by task.
- Update the `> Status:` line to `In Progress (Phase N)` as you enter each phase.
- Check off tasks as you complete them: `- [ ]` → `- [x]`
- When you reach a `**Checkpoint**` task, **stop and ask the user to verify** before proceeding to the next phase. Do not skip checkpoints.
- After all phases are complete, update the status to `Complete`.

If no plan file exists, fall back to the ad-hoc workflow below (steps 1–6).

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
- Update `project/features/INDEX.md` status to "In Progress" (if not already)
- If a plan file exists, ensure all checkboxes are checked and status is `Complete`

## Plan Tracking Rules

When a plan file exists at `project/plans/BIKE-X-plan.md`, follow these rules strictly:

1. **Execute in order.** Complete all tasks in Phase 1 before starting Phase 2.
2. **Check off immediately.** After completing a task, edit the plan file to mark it `[x]` right away. Do not batch checkbox updates.
3. **Pause at checkpoints.** When you reach a `**Checkpoint**` task, present a summary of what was done in that phase and ask the user to verify. Only proceed when the user confirms.
4. **Update status line.** Keep the `> Status:` line current: `Not Started` → `In Progress (Phase 1)` → `In Progress (Phase 2)` → ... → `Complete`.
5. **Note deviations.** If you need to deviate from the plan (skip a task, add a task, change order), note it in the plan file with a comment: `<!-- Deviated: reason -->`.

## Principles

- **Reuse first.** Always check for existing utilities, components, services before creating new ones.
- **Follow patterns.** Match the established code style and architecture. Read existing files for reference.
- **Minimal changes.** Only change what's needed for the feature. No drive-by refactors.
- **Clean up.** Remove dead code, orphaned imports, and unused files as you go.
- **Propagate changes.** When modifying a signature or contract, update all callers.

## Context Recovery

If your context was compacted mid-task:
1. Re-read the feature spec and tech design
2. **Re-read `project/plans/BIKE-X-plan.md`** — checked-off tasks show what's done, unchecked show what remains
3. Run `git diff` to see what you've already changed
4. Run `git status` to see uncommitted work
5. Re-read `project/features/INDEX.md` for current status
6. Continue from where you left off

## Handoff

After implementation is complete:
> "Implementation is done! Next step: Run the `qa` skill to test against the acceptance criteria."
>
> If APIs, models, or auth flows changed, update `project/ARCHITECTURE.md` to keep it in sync.

## Git Commits

Commit at **logical task boundaries** — ideally after each completed plan task or small group of related tasks. Use conventional commits with the feature ID:
```
feat(BIKE-X): description of what was built
fix(BIKE-X): description of what was fixed
```

This makes it possible to revert individual tasks or phases without undoing the entire feature. Each commit message should map clearly to a plan task.

## Reverting Changes

If the user asks to revert a task, phase, or entire feature:

1. **Revert a single task:** Find the commit(s) for that task using `git log --oneline --all -- <affected files>` and revert them:
   ```bash
   git revert <commit-hash> --no-edit
   ```
2. **Revert a phase:** Identify all commits in the phase (they share the `feat(BIKE-X):` prefix and were made in sequence). Revert them in reverse order:
   ```bash
   git revert <newest-hash>..<oldest-hash-parent> --no-edit
   ```
3. **Revert entire feature:** If commits were clean, revert all `feat(BIKE-X)` / `fix(BIKE-X)` commits. Check `git log --oneline --grep="BIKE-X"`.

After reverting, update the plan file: uncheck the reverted tasks and update the status line accordingly.
