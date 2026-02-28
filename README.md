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
├── scripts/         # Setup & utility scripts
├── product-plan/    # Design docs & implementation plan
└── docker-compose.yml
```

## Testing

```bash
make test-backend    # pytest (backend)
make test-agent      # pytest (agent)
make test-frontend   # Playwright E2E (frontend)
```

## License

All rights reserved.
