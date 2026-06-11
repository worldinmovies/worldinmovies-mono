# Finishing Plan — worldinmovies-mono

## Audit Summary

### Repos analyzed

| Repo | Status | Action |
|------|--------|--------|
| `worldinmovies/webapp` | Deprecated | None — superseded by apps/webapp in monorepo |
| `worldinmovies/tmdb` | Migrated ✅ | All code/features in services/tmdb |
| `worldinmovies/integration-tests` | Migrated ✅ | All files in tests/e2e (flattened) |
| `worldinmovies/globe-reel-gems` | Same codebase | Clone of monorepo webapp using npm; no migration needed |
| `worldinmovies/neo4j` | Deprecated (user confirmed) | None |
| `worldinmovies/imdb` | Unknown | Not in production Flux infra. tmdb absorbed its functionality |
| `seppaleinen/fleet-infra` | Separate | FluxCD deployment manifests live here, not in monorepo |

### Production deployment (from fleet-infra)

Deployed via FluxCD on home cluster:
- **tmdb** (backend API + Celery worker)
- **webapp** (React frontend with nginx + ingress)
- **meilisearch** (search engine)
- **mongo** (database)
- **rabbitmq** (message queue)

NOT deployed: imdb, neo4j.

Docker images: `seppaleinen/worldinmovies_tmdb:latest`, `seppaleinen/worldinmovies_webapp:latest`
— CI builds these as multi-arch (amd64 + arm64) and pushes `:latest` manifest.

---

## Work Items

### Phase 1: Close the imdb question

**Context**: The `worldinmovies/imdb` repo is a legacy Django app (PostgreSQL, Channels, Kafka) that imported IMDB ratings and alternative titles. Its functionality has been absorbed into `services/tmdb/apps/imdb/imdb_importer.py`. It is NOT deployed in production (no Flux config references it).

**Task**: Verify imdb functionality is fully covered in tmdb, then archive the old repo.

- [ ] Compare `worldinmovies/imdb/app/importer.py` → `services/tmdb/apps/imdb/imdb_importer.py` — verify all functions exist
- [ ] Compare `worldinmovies/imdb/app/models.py` → `services/tmdb/apps/app/db_models.py` — verify all data models covered
- [ ] Check `worldinmovies/imdb/app/views.py` → `services/tmdb/apps/api/views.py` — verify API endpoints
- [ ] Verify `worldinmovies/imdb/app/websocket.py` → `services/tmdb/apps/app/websocket.py`
- [ ] Verify kafka consumer logic is in tmdb (check `apps/app/helper.py` or worker)
- [ ] If all covered, archive `worldinmovies/imdb` on GitHub (or add ARCHIVED.md note)

---

### Phase 2: Fix the deploy pipeline

**Context**: `.github/workflows/deploy.yml` has ALL `on:` triggers commented out. It was meant to deploy via WireGuard SSH tunnel to the home server but was never activated. The original integration-tests repo's deploy.yml was also commented out — this has always been incomplete.

**Task**: Activate and fix the deploy pipeline.

- [ ] Uncomment the `on:` triggers in `.github/workflows/deploy.yml`
- [ ] Add `workflow_dispatch` with `trigger` input for manual deploys
- [ ] Update script path from `workspace/integration-tests` to `workspace/worldinmovies-mono/tests/e2e` (or wherever the server clone lives)
- [ ] Decide deployment strategy:
  - Option A: SSH into server, `git pull`, `docker compose pull`, `docker compose up -d`
  - Option B: Flux-aware deployment — trigger image update in fleet-infra (see Phase 5)
- [ ] Verify WireGuard + SSH secrets exist on GitHub
- [ ] Test with `workflow_dispatch`

---

### Phase 3: Fix Sentry version alignment

**Context**: `apps/webapp/package.json` has `@sentry/capacitor ^4.0.0` and `@sentry/react ^10.0.0` — these are on different major versions. The `globe-reel-gems` version had both at `^8.0.0`. Sentry packages should use compatible versions.

**Task**: Align Sentry versions.

- [ ] Check Sentry compatibility matrix for @sentry/capacitor + @sentry/react
- [ ] Update both to latest compatible pair (likely both at `^8` or both at `^9`)  
- [ ] Verify the integration still works (`pnpm build`, `pnpm test`)
- [ ] Also verify Sentry init in `main.tsx` matches the new SDK API

---

### Phase 4: Consolidate E2E test runners ✅ DONE

**Outcome**: Cypress removed. Playwright is the single E2E runner. Artillery kept as-is for load testing, with configs moved out of cypress/ directory.

Changes:
- Moved `cypress/playwright/` → `playwright/`
- Moved `cypress/artillery/` → `artillery/`
- Converted Cypress integration tests (mongo, rabbit, tmdb api, web) to Playwright
- Updated CI `integration-test` job to use `pnpm e2e:test` (Playwright)
- Removed Cypress from package.json, pnpm-workspace.yaml, tsconfig.json
- Deleted `cypress/` directory and `cypress.config.ts`

---

### Phase 5: (Optional) Fleet-infra consolidation

**Context**: The FluxCD deployment manifests for worldinmovies live in a separate repo (`seppaleinen/fleet-infra`), not in the monorepo. For true "everything in one place", you could either:

- **A**: Copy fleet-infra's worldinmovies config into the monorepo (e.g., `deploy/flux/`) and point Flux at the monorepo
- **B**: Keep fleet-infra separate but add CI job that updates fleet-infra on push (via GitHub dispatch or PR)
- **C**: Do nothing — deployment infra stays separate

**Task**: Decide and implement.

- [ ] Review the flux config in `seppaleinen/fleet-infra/flux/worldinmovies/` (tmdb, webapp, tmdb-worker, mongo, meilisearch, rabbitmq)
- [ ] If migrating into monorepo: copy to `deploy/flux/worldinmovies/` and update Flux `sourceRef`
- [ ] If keeping separate: add a CI dispatch job that triggers fleet-infra update workflow

---

### Phase 6: Dockerfile optimization

**Context**: 
- `services/tmdb/Dockerfile` uses `COPY . /app` then `WORKDIR /app/services/tmdb` — includes the entire monorepo source. Mitigated by `.dockerignore` but still includes more than needed.
- `apps/webapp/Dockerfile` uses `node:24-alpine` — Node 24 is very new (released ~2025). May cause build issues.

**Task**: Optimize Dockerfiles.

- [ ] tmdb Dockerfile: after `COPY --from=builder`, only copy `services/tmdb/` and `apps/` (or specific app dirs), not the whole monorepo root
- [ ] webapp Dockerfile: consider pinning to `node:22-alpine` for stability (matches CI node version)
- [ ] Test both with `pnpm build:docker:tmdb` and `pnpm build:docker:webapp`

---

### Phase 7: Minor improvements

- [ ] Add `tsc --noEmit` type-check step to CI (fast, catches type errors)
- [ ] Add turbo remote caching (Vercel or GitHub Actions cache)
- [ ] If using Trunk.io, copy `.trunk/` configs from original tmdb/globe-reel-gems repos into monorepo root
- [ ] Add a `Makefile` or root `setup.sh` for first-time developer setup (pnpm install + uv venv + pre-commit)

---

## File inventory

### Missing from original tmdb repo (intentionally)
- `.github/workflows/tmdb.yml` → superseded by monorepo `ci.yml`
- `.trunk/*` → optional linting configs (Phase 7)
- `testdata/mini_ratings.tsv.gz` → duplicate of plain `.tsv`, not needed
- `testdata/mini.title.akas.tsv.gz` → not referenced in code

### Missing from original integration-tests repo (intentionally)
- `.github/workflows/IT.yml` → superseded by monorepo `ci.yml`
- `.github/workflows/deploy.yml` → superseded by monorepo `deploy.yml`

### Files in monorepo but half-finished
| File | Problem | Phase |
|------|---------|-------|
| `.github/workflows/deploy.yml` | All triggers commented out | Phase 2 |
| `tests/e2e/playwright.config.ts` | `testDir` points into cypress/ dir | Phase 4 |
| `tests/e2e/package.json` | `e2e:test` uses Playwright, CI uses Cypress | Phase 4 |
| `apps/webapp/package.json` | Sentry version mismatch | Phase 3 |
| `apps/webapp/Dockerfile` | Uses Node 24 | Phase 6 |
| `services/tmdb/Dockerfile` | `COPY . /app` is too broad | Phase 6 |
