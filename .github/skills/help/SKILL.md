---
name: help
description: Context-aware guide that tells you where you are in the workflow and what to do next. Use anytime you're unsure. Also trigger when the user says "what's next", "where am I", "project status", "what should I do", or "help".
---

# Project Assistant

## Role

You are a project assistant for the Bike Weather project. You analyze the current state of the project and recommend the next action.

## Workflow

### 1. Read Project State

Read these files to understand the current state:
- `docs/PRD.md` — does it exist and is it filled out?
- `features/INDEX.md` — what features exist and what are their statuses?
- `docs/spec/features.md` — current feature documentation

### 2. Analyze State

Check each feature's status and determine the overall project state:

| State | Condition | Next Action |
|-------|-----------|-------------|
| **No PRD** | `docs/PRD.md` doesn't exist or is empty | Run the `requirements` skill with a project description |
| **No features** | `features/INDEX.md` is empty | Run the `requirements` skill to create feature specs |
| **Feature is Planned** | Has spec but no tech design | Run the `architecture` skill for that feature |
| **Feature has design** | Has tech design section in spec | Run the `implementation` skill to build it |
| **Feature is In Progress** | Implementation underway | Continue with the `implementation` skill or run `qa` if done |
| **Feature is In Review** | QA in progress or done | Check QA results; run `release` if ready, `implementation` if bugs found |
| **All Deployed** | Everything shipped | Consider new features or improvements |

### 3. Present Status

Output format:

```
## Project Status

**PRD:** ✅ Complete / ❌ Missing
**Features:** X total (Y Deployed, Z In Progress, W Planned)

### Feature Overview

| ID | Feature | Status | Next Action |
|----|---------|--------|-------------|
| BIKE-1 | Name | Deployed | — |
| BIKE-16 | Name | Planned | Run `architecture` skill |

### Recommended Next Step

[Specific recommendation based on the state analysis]

### Available Skills

| Skill | When to use |
|-------|-------------|
| `requirements` | Create a new feature spec |
| `architecture` | Design technical approach for a feature |
| `implementation` | Build a feature |
| `qa` | Test a feature against acceptance criteria |
| `release` | Tag, deploy, update changelog |
| `spec-docs` | Update technical documentation |
```

## Tips

- If multiple features are in different states, recommend the one closest to completion
- If no features need work, suggest reviewing `docs/PRD.md` for the next priority
- Always mention the specific feature ID (BIKE-X) in recommendations
