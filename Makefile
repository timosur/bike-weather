# Load .env if it exists
-include .env
export

COMPOSE_DEV := docker compose -f docker-compose.yml

.PHONY: help setup dev dev-stop db-up db-stop db-migrate db-reset db-shell test-backend test-agent build-frontend clean

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

setup: db-up ## Create .env from template, install deps, provision Authentik
	@test -f .env || (cp .env.example .env && echo "Created .env from .env.example")
	cd backend && uv sync --all-extras
	cd agent && uv sync --all-extras
	cd frontend && npm install
	python3 scripts/setup_authentik.py

dev: db-up db-migrate ## Start PostgreSQL, run migrations, seed, launch backend + frontend
	cd backend && uv run honcho start -f ../Procfile.dev -e ../.env

dev-stop: db-stop ## Stop the PostgreSQL dev container

db-up: ## Start PostgreSQL + Authentik containers
	$(COMPOSE_DEV) up -d --wait

db-stop: ## Stop all dev containers
	$(COMPOSE_DEV) down

auth-setup: db-up ## Provision Authentik OAuth2 app (idempotent)
	python3 scripts/setup_authentik.py

db-migrate: ## Run alembic migrations
	cd backend && uv run alembic upgrade head

db-reset: ## Destroy volume, recreate database, migrate
	$(COMPOSE_DEV) down -v
	$(COMPOSE_DEV) up -d --wait
	cd backend && uv run alembic upgrade head

db-shell: ## Open psql shell in the database container
	docker exec -it bikeweather-db-dev psql -U bike -d bikeweather

admin-grant: ## Grant admin rights to a user (usage: make admin-grant EMAIL=user@example.com)
	@test -n "$(EMAIL)" || (echo "Usage: make admin-grant EMAIL=user@example.com" && exit 1)
	docker exec -it bikeweather-db-dev psql -U bike -d bikeweather -c "UPDATE users SET is_admin = true WHERE email = '$(EMAIL)';"
	@echo "Admin rights granted to $(EMAIL)"

admin-revoke: ## Revoke admin rights from a user (usage: make admin-revoke EMAIL=user@example.com)
	@test -n "$(EMAIL)" || (echo "Usage: make admin-revoke EMAIL=user@example.com" && exit 1)
	docker exec -it bikeweather-db-dev psql -U bike -d bikeweather -c "UPDATE users SET is_admin = false WHERE email = '$(EMAIL)';"
	@echo "Admin rights revoked from $(EMAIL)"

test-backend: ## Run backend tests with pytest
	cd backend && uv run pytest

test-agent: ## Run agent tests with pytest
	cd agent && uv run pytest

build-frontend: ## Build frontend for production
	cd frontend && npm run build

clean: ## Remove venv, node_modules, and dist
	rm -rf backend/.venv
	rm -rf agent/.venv
	rm -rf frontend/node_modules
	rm -rf frontend/dist
