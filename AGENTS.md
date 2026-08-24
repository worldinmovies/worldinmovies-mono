# Agent Guidelines: worldinmovies-mono

This document contains instructions for agents (AI and human) working on the `worldinmovies-mono` repository.

## 🏗️ Architecture & Context

- **Project Goal**: A high-performance movie discovery platform providing top-ranked films from every country.
- **Orchestration**: Monorepo managed via `pnpm` workspaces and `TurboRepo`.
- **Frontend**: React (Vite) using Tailwind CSS and Shadcn/UI, with `@capacitor` for mobile/native compatibility.
- **Backend**: Django (Python 3.13) running with `hypercorn` (ASGI).
- **Tasks/Workers**: Celery (task queue) + Redis/RabbitMQ for async processing.
- **Database**: MongoDB for movie metadata/ratings and SQLite for lightweight backend storage.
- **E2E Testing**: Playwright is the primary runner. Artillery is used for load testing.

## 🛠️ Developer Do's & Don'ts

### Do
- ✅ Use `pnpm` for all package management.
- ✅ Follow the workspace naming convention: `@worldinmovies/{scope}`.
- ✅ Run `pnpm test` to validate changes across the entire stack.
- ✅ Run `pnpm typecheck` in `apps/webapp` to catch TS errors before testing.
- ✅ Use `uv` for managing Python dependencies in `services/tmdb`.
- ✅ Use `.nvmrc` to ensure Node.js 22 environment.

### Don't
- ❌ Do not use `npm` or `yarn`.
- ❌ Do not install globally-scoped dependencies in workspaces without checking workspace boundaries.
- ❌ Do not use Cypress; it has been deprecated in favor of Playwright.
- ❌ Do not manually edit `.ipynb` or other notebook files unless specifically instructed for data science tasks.

## 🚀 Workflow & CI

- **CI Pipeline**:
  - `frontend-test`: Vitest + Typecheck (Node 22)
  - `backend-test`: Django Behave (Python 3.12/3.13)
  - `integration-test`: Docker-based Playwright suite
  - `build-*`: Multi-arch (amd64/arm64) Docker builds
  - `publish-charts`: Packages and publishes Helm charts to `ghcr.io/worldinmovies/charts` on push to `main` with `charts/**` changes
- **Deployment**: GitOps via FluxCD on a k3s cluster. Images are built by CI/Release workflows, Renovate in fleet-infra updates image tags in HelmRelease values, and Flux reconciles automatically.

## 🎨 Helm Charts

Helm charts live under `charts/` in the monorepo root:

| Chart | Description | Sub-chart deps |
|-------|-------------|----------------|
| `charts/tmdb/` | Django API backend | MongoDB (optional), RabbitMQ (optional) |
| `charts/tmdb-worker/` | Celery worker | MongoDB (optional), RabbitMQ (optional) |
| `charts/webapp/` | React frontend | None |
| `charts/worldinmovies/` | **Umbrella chart** (bundles all 3 + optional infra) | tmdb, tmdb-worker, webapp, MongoDB (optional), RabbitMQ (optional) |

The umbrella chart provides a single `helm install` command for the full stack:

```bash
# With bundled infra:
helm install worldinmovies ./charts/worldinmovies \
  --set mongodb.enabled=true --set rabbitmq.enabled=true

# With existing infra (default):
helm install worldinmovies ./charts/worldinmovies
```

Component charts are published to `ghcr.io/worldinmovies/charts` as OCI artifacts on every push to `main` that changes `charts/**`. The umbrella chart is not published via CI (it's designed for local deployment from the monorepo or a `file://` reference).

**Versioning**: Auto-bumped from conventional commit messages (`BREAKING CHANGE` → major, `feat:` → minor, else → patch). Each chart maintains an independent semver. Chart release tags follow `helm/{name}-X.Y.Z`.

**Dependencies**: MongoDB and RabbitMQ can be bundled as sub-charts (set `mongodb.enabled=true` / `rabbitmq.enabled=true`) or pointed to existing instances via `external.mongoURL` / `external.rabbitmqURL` (default).

**Secrets**: Placeholder values in chart `values.yaml` (e.g., `REPLACE_ME`). Real secrets are supplied at install/upgrade time via `--set` or `valuesFrom`. SOPS-encrypted production secrets live in fleet-infra.

## ⚠️ Critical Constraints

- **Mobile/Native**: Ensure all UI components remain compatible with `@capacitor`.
- **Environment**: Docker containers must be running for E2E integration tests to pass.
- **Secrets**: Do not commit secrets. Use environment variables (e.g., `VITE_SENTRY_DSN`, `DJANGO_SECRET_KEY`).

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
