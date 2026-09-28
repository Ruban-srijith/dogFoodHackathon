.PHONY: all up down restart reset build test lint seed migrate logs health acceptance clean

# Default environment variables
DC ?= docker compose
SHELL := /bin/bash

all: up

## Container & Cluster Operations
up:
	@echo "Starting DOGFOOD Hackathon Platform..."
	$(DC) up -d --build
	@echo "DOGFOOD is starting on http://localhost:8080"

down:
	@echo "Stopping DOGFOOD services..."
	$(DC) down

restart: down up

build:
	@echo "Building DOGFOOD Docker containers..."
	$(DC) build

logs:
	$(DC) logs -f

health:
	@echo "Checking DOGFOOD platform health..."
	@curl -sf http://localhost:8080/health || curl -sf http://localhost:3000/health || (echo "Health check failed" && exit 1)
	@echo "\nPlatform is healthy!"

## Database Operations
migrate:
	@echo "Running database migrations..."
	@if [ -f "./scripts/init.sh" ]; then bash ./scripts/init.sh migrate; else npm --prefix backend run db:migrate; fi

seed:
	@echo "Seeding deterministic demo data..."
	@if [ -f "./scripts/seed.sh" ]; then bash ./scripts/seed.sh; else npm --prefix backend run db:seed; fi

reset:
	@echo "Resetting database and platform state..."
	@if [ -f "./scripts/reset.sh" ]; then bash ./scripts/reset.sh; else npm --prefix backend run db:reset; fi

## Code Quality & Testing
lint:
	@echo "Linting frontend and backend..."
	@if [ -d "backend" ] && [ -f "backend/package.json" ]; then npm --prefix backend run lint || true; fi
	@if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then npm --prefix frontend run lint || true; fi

test:
	@echo "Running test suite (unit, integration, security)..."
	@npm test

acceptance:
	@echo "Running end-to-end acceptance test suite..."
	@bash ./scripts/healthcheck.sh
	@npm run test:acceptance
