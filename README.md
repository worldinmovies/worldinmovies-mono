# worldinmovies-mono

Monorepo for World in Movies — discover top-ranked films from every country.

## Structure

```
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
