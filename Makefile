# Load .env if it exists
-include .env
export

COMPOSE_DEV := docker compose -f docker-compose.dev.yml

.PHONY: help setup dev dev-stop db-up db-stop db-migrate db-seed db-reset db-shell test-backend build-frontend clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

setup: ## Create .env from template and install all dependencies
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example")
	cd backend && uv pip install -e ".[dev]"
	cd frontend && npm install

dev: db-up db-migrate ## Start PostgreSQL, run migrations, launch backend + frontend
	uv run honcho start -f Procfile.dev -e .env

dev-stop: db-stop ## Stop the PostgreSQL dev container

db-up: ## Start PostgreSQL container
	$(COMPOSE_DEV) up -d --wait

db-stop: ## Stop PostgreSQL container
	$(COMPOSE_DEV) down

db-migrate: ## Run alembic migrations
	cd backend && uv run alembic upgrade head

db-seed: ## Run the seed script
	cd backend && uv run python -c "\
import asyncio;\
from app.seed import run_seed;\
from app.database import async_session;\
async def _main():\
    async with async_session() as s:\
        await run_seed(s);\
        print('Seed complete.');\
asyncio.run(_main())"

db-reset: ## Destroy volume, recreate database, migrate, and seed
	$(COMPOSE_DEV) down -v
	$(COMPOSE_DEV) up -d --wait
	cd backend && uv run alembic upgrade head
	@echo "Database reset complete. Seed data will load on next backend startup."

db-shell: ## Open psql shell in the database container
	docker exec -it bikeweather-db-dev psql -U bike -d bikeweather

test-backend: ## Run backend tests with pytest
	cd backend && uv run pytest

build-frontend: ## Build frontend for production
	cd frontend && npm run build

clean: ## Remove venv, node_modules, and dist
	rm -rf backend/.venv
	rm -rf frontend/node_modules
	rm -rf frontend/dist
