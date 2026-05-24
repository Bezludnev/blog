.PHONY: help env install dev start build lint test-e2e generate generate-importmap generate-types verify payload mongo-up mongo-down mongo-logs compose-up compose-down compose-logs

ARGS ?=

help: ## Show available commands.
	@awk 'BEGIN {FS = ":.*## "; printf "Available commands:\n"} /^[a-zA-Z0-9_-]+:.*## / {printf "  %-20s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

env: ## Create .env from .env.example if it does not exist.
	@test -f .env || cp .env.example .env

install: ## Install project dependencies.
	pnpm install

dev: ## Start the Next.js development server.
	pnpm dev

start: ## Start the production Next.js server.
	pnpm start

build: ## Build the project for production.
	pnpm build

lint: ## Run ESLint.
	pnpm lint

test-e2e: ## Run Playwright browser smoke tests.
	pnpm test:e2e

generate: generate-importmap generate-types ## Generate Payload import map and TypeScript types.

generate-importmap: ## Generate Payload admin import map.
	pnpm generate:importmap

generate-types: ## Generate Payload TypeScript types.
	pnpm generate:types

verify: generate lint build ## Run the standard local verification sequence.

payload: ## Run a Payload CLI command, for example: make payload ARGS="generate:types".
	pnpm payload $(ARGS)

mongo-up: ## Start only the local MongoDB container.
	docker compose up -d mongo

mongo-down: ## Stop local Docker Compose services.
	docker compose down

mongo-logs: ## Follow local MongoDB logs.
	docker compose logs -f mongo

compose-up: ## Start the full Docker Compose stack.
	docker compose up -d

compose-down: ## Stop the full Docker Compose stack.
	docker compose down

compose-logs: ## Follow Docker Compose service logs.
	docker compose logs -f
