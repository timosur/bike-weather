# Bike Weather

Bike Weather is a web app that gives cyclists personalized clothing and gear recommendations based on real weather data for their planned rides.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite 6, Tailwind CSS
- **Backend:** Python 3.12+, FastAPI, SQLModel, asyncpg, Alembic
- **Product Agent:** LLM-powered product scraper (OpenAI + Anthropic)
- **Auth:** Authentik (self-hosted OIDC) with Google OAuth
- **Database:** PostgreSQL 16
- **Infra:** Docker Compose

## Getting Started

### Prerequisites

- Docker
- Node.js 24+
- Python 3.12+
- [uv](https://docs.astral.sh/uv/) (Python package manager)

### Setup & Run

```bash
make setup   # creates .env, installs Python + Node deps, provisions Authentik
make dev     # starts PostgreSQL + Authentik, runs migrations, launches backend + frontend
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- Authentik: http://localhost:9000

Press Ctrl+C to stop the app processes. Use `make dev-stop` to stop containers.

Run `make help` to see all available targets.

## Project Structure

```
├── frontend/        # React SPA (Vite + Tailwind)
├── backend/         # FastAPI REST API
├── agent/           # LLM product scraper agent
├── project/         # PRD, feature specs, plans, technical specs
├── scripts/         # Setup & utility scripts
└── docker-compose.yml
```

## Development Workflow

Features are developed using a structured, skill-based pipeline. Each phase is a Copilot skill:

```
requirements → architecture → implementation → qa → release
```

| Skill            | Purpose                                                        |
| ---------------- | -------------------------------------------------------------- |
| `requirements`   | Create feature specs with user stories and acceptance criteria |
| `architecture`   | Design tech architecture (PM-friendly, no code)                |
| `implementation` | Build the feature across frontend/backend/agent                |
| `qa`             | Test against acceptance criteria + security audit              |
| `release`        | Tag, deploy, update changelog                                  |
| `spec-docs`      | Update technical spec docs in `project/spec/`                  |
| `help`           | Check project status and get next-step guidance                |

**Feature tracking:** All features are tracked in `project/features/INDEX.md` with specs in `project/features/BIKE-X-name.md`. See `project/features/README.md` for the full workflow.

**Product context:** See `project/PRD.md` for product vision, target users, and roadmap.

## Testing

```bash
make test-backend    # pytest (backend)
make test-agent      # pytest (agent)
make test-frontend   # Playwright E2E (frontend)
```

## License

All rights reserved.
