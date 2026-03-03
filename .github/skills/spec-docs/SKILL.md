---
name: spec-docs
description: Generates and maintains the project's technical and functional specification documents under docs/spec/. Use this skill when the user mentions updating specs, refreshing documentation, generating spec, syncing docs, documenting the application, or says things like "update spec", "refresh docs", "document the app", "what does the app do", or "update technical docs". Also invoke after making non-trivial code changes to keep the spec in sync.
---

# Spec Documentation Skill

Generate and maintain high-level technical and functional specification documents for bike-weather.

## Overview

This skill produces a set of spec files under `docs/spec/` that describe the application at a high level. These docs serve as persistent context for future agent sessions and as living documentation for the team.

The spec is **high-level** — architecture, features, API surface, data models, and auth flow. Not exhaustive API reference docs.

## Output Files

All files live in `docs/spec/` at the repository root:

| File | Purpose |
|------|---------|
| `architecture.md` | System overview, service boundaries, tech stack, infrastructure, how services communicate |
| `api.md` | API endpoint inventory — route, method, auth requirement, brief description |
| `data-models.md` | ORM models with key fields, relationships, and purpose |
| `features.md` | User-facing feature inventory with descriptions and current status |
| `auth-flow.md` | Authentication and authorization flow — Authentik OIDC, JWT validation, roles, route guards |

## Workflow

### Step 1: Read the current spec (if it exists)

Check if `docs/spec/` exists and read all existing spec files to understand what's already documented.

### Step 2: Scan the codebase

Read the actual source files to extract current state. Do NOT guess or hallucinate — only document what exists in code.

**Architecture:**
- Read `docker-compose.yml` for infrastructure
- Read `Makefile` for build/run commands
- Read `backend/app/main.py` and `frontend/src/App.tsx` for service entry points
- Read `README.md` for project overview

**API endpoints:**
- Read all files in `backend/app/api/routes/` to list every endpoint
- Note the HTTP method, path, auth requirement (check for `Depends` on auth), and purpose
- Read `backend/app/api/__init__.py` or the main router file to see how routes are mounted

**Data models:**
- Read all files in `backend/app/models/` to document ORM models
- Note field names, types, relationships, and which model maps to which table
- Read `backend/app/schemas/` for request/response schemas that differ from models

**Features:**
- Cross-reference frontend pages (`frontend/src/pages/`) with backend endpoints
- Read `frontend/src/App.tsx` for all routes and their components
- Document each user-facing feature with a brief description

**Auth flow:**
- Read `backend/app/api/dependencies.py` for JWT validation logic
- Read `frontend/src/contexts/AuthContext.tsx` for OIDC client setup
- Read `frontend/src/App.tsx` for route guards (`RequireAuth`, `RequireAdmin`)
- Document the full flow: login → token → validation → authorization

### Step 3: Generate or update the spec files

**If generating for the first time:**
- Create all five files from scratch based on the codebase scan
- Each file should have a clear header, last-updated note, and organized sections

**If updating existing files:**
- Compare the current spec content with what the codebase scan reveals
- Update only the sections that have changed
- Add new entries for new endpoints, models, features, etc.
- Remove entries for deleted code
- Update the "Last updated" timestamp at the top of each file

### Step 4: Summary

After generating/updating, provide a brief summary of what changed:
- New items added
- Items updated
- Items removed
- Files that were unchanged

## File Format

Each spec file should follow this format:

```markdown
# [Title]

> Last updated by spec-docs skill. Reflects codebase as of the latest run.

## Section

Content organized with tables, lists, or prose as appropriate.
```

## Important Rules

1. **Read actual source files** — never guess at endpoints, models, or features. If you can't read a file, note it as "unable to verify."
2. **Stay high-level** — document the "what" and "why", not implementation details. No code snippets unless essential for understanding.
3. **Be precise about auth** — clearly mark which endpoints require authentication and which roles are needed.
4. **Track deletions** — if something documented in the spec no longer exists in code, remove it from the spec.
5. **Preserve manual additions** — if a human has added notes or context to spec files (marked with `<!-- manual -->` comments), preserve them during updates.
