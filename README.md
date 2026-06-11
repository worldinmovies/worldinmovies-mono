# worldinmovies-mono

Monorepo for World in Movies — discover top-ranked films from every country.

## 🏗️ Architecture & Overview

A multi-platform movie discovery engine.

- **Frontend**: React (Vite) with `@capacitor` for mobile/native cross-platform consistency.
- **Backend**: Django (Python) with `hypercorn` (ASGI), `Celery` for tasks, and `MongoDB` for high-volume movie data.
- **Orchestration**: `pnpm` workspaces + `TurboRepo` for high-performance parallel execution.
- **E2E Testing**: Single-runner architecture using **Playwright** (Integrated) and **Artillery** (Load Testing).

## 🚀 Quick Start

### Prerequisites
- **Node.js 22** (via `.nvmrc`)
- **pnpm >= 11**
- **Python 3.13** (via `uv`)
- **Docker** (for integration tests)

### Development & Testing
```bash
# Install dependencies
pnpm install

# Run all tests (frontend vitest + backend behave + playwright) in parallel
pnpm test

# Run frontend typecheck
pnpm --filter @worldinmovies/webapp typecheck

# Run individual suites
pnpm test:frontend  # Vitest
pnpm test:backend   # Behave
pnpm test:e2e       # Playwright
```

### Backend & Frontend Dev Servers
```bash
# Backend (requires MongoDB local)
cd services/tmdb
pnpm setup:backend && python manage.py runserver

# Frontend
cd apps/webapp
pnpm dev
```

## 📦 Docker & Deployment

### Builds
```bash
# Build and push multi-arch images
pnpm build:docker:tmdb
pnpm build:docker:webapp
```

### Deployment (Manual)
Deployment is managed via GitHub Actions using a WireGuard SSH tunnel to the home server.
Use the `deploy` workflow with the `trigger` input to specify which service to update:
`tmdb`, `webapp`, `tmdb-worker`, or (empty) for all.

## 📚 Documentation
- [AGENTS.md](./AGENTS.md) — Developer guidelines and architecture overview.
- [FINISHING_PLAN.md](./FINISHING_PLAN.md) — Roadmap and historical context.

apps/webapp/       React frontend (Vite + Capacitor)
services/tmdb/     Django backend (Celery + MongoDB + Meilisearch)
tests/e2e/         E2E tests (Playwright, Cypress, Artillery) + Docker Compose infra
docs/              Planning docs
```

## Prerequisites

- **Node.js 22+** (for frontend + E2E tools)
- **pnpm >= 11** (`npm install -g pnpm`)
- **Python 3.12+** (for backend)
- **Docker** (for integration tests)

## Quick Start

```bash
# Install all JS dependencies
pnpm install

# Run tests (frontend unit + backend BDD + E2E in parallel)
pnpm test

# Or run individually
pnpm test:frontend
pnpm test:backend
pnpm test:e2e
```

## Development

```bash
# Backend (requires MongoDB on localhost:27017)
cd services/tmdb
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
MONGO_URL=localhost:27017 hypercorn --config=gunicorn.config.py --reload settings.asgi:application

# Frontend
cd apps/webapp
npm run dev
```

## Docker Builds

```bash
pnpm build:docker:tmdb
pnpm build:docker:webapp
```

## Integration Tests

Full stack with Docker Compose:

```bash
cd tests/e2e
echo "VITE_WEBAPP_PORT=80
DJANGO_SECRET_KEY=$(uuidgen)" > .env
docker compose up -d
./wait_until_running.sh
npm run cypress:test
```
