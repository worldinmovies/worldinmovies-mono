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

### Phase 1: Close the imdb question ✅ DONE

**Verdict**: imdb functionality is fully covered by `services/tmdb/apps/imdb/imdb_importer.py` — imports IMDB ratings (title.ratings.tsv.gz) and alternative titles (title.akas.tsv.gz) from the same datasets the old repo used, but via Celery + RabbitMQ + MongoDB instead of Kafka + PostgreSQL. Not deployed in production. Old repo can be archived on GitHub.

---

### Phase 2: Fix the deploy pipeline ✅ DONE

Changes:
- Enabled `workflow_dispatch` trigger with optional `trigger` input (tmdb, webapp, tmdb-worker, or empty for all)
- `push` on main left commented out (needs CI-to-deploy ordering sorted first)
- Single WireGuard SSH step does: `git pull origin main` → `docker compose pull $trigger` → `docker compose up -d $trigger`
- Replaced broken `Check errors` step with SSH-based error collection on the server
- Requires secrets set up on GitHub: `SSH_USER`, `SSH_IP`, `SSH_PORT`, `SSH_PRIVATE_KEY`, `WIREGUARD_CONFIG`

---

### Phase 3: Fix Sentry version alignment ✅ SKIPPED — NOT A BUG

**Verdict**: `@sentry/capacitor@4.0.0` and `@sentry/react@10.x` are correctly aligned. Capacitor SDK versions are independent of JS SDK versions. Peer dependency check confirms `@sentry/capacitor@4.0.0` requires `@sentry/react@10.43.0`, and `^10.0.0` in our package.json satisfies this fully.

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

### Phase 6: Dockerfile optimization ✅ DONE

Changes:
- `apps/webapp/Dockerfile`: `node:24-alpine` → `node:22-alpine` (matches CI Node version)
- `services/tmdb/Dockerfile`: `COPY . /app` → `COPY services/tmdb/ /app/services/tmdb/` (scoped copy, narrower build context)

---

### Phase 7: Minor improvements ✅ DONE

Changes:
- Added `"typecheck": "tsc -b --noEmit"` to webapp package.json
- Added typecheck step to CI `frontend-test` job (runs after install, before tests)
- Added `.nvmrc` with `22` at repo root

Skipped:
- Turbo remote cache — requires Vercel account or custom server, not trivial
- `.trunk/` configs — not on trunk.io workflow
- `Makefile`/`setup.sh` — covered by existing `pnpm setup:backend` + `pnpm install`

---

### Phase 8: Versioned Docker image releases ✅ DONE

**Context**: Docker images were only tagged `:latest` (pushed on every push to `main` via CI). Issue #5 asked for a release workflow that tags images with semver versions and creates GitHub Releases.

**Changes:**
- Created `.github/workflows/release.yml` — triggered by pushing `v*` tags or `workflow_dispatch`
- Builds multi-arch (amd64 + arm64) Docker images for both `seppaleinen/worldinmovies_tmdb` and `seppaleinen/worldinmovies_webapp`
- Tags images with both `:vX.Y.Z` (semver, stripped of `v` prefix) and `:latest`
- Creates a GitHub Release with auto-generated release notes from `softprops/action-gh-release`
- Pre-release detection: tags containing `-` (e.g., `v1.0.0-rc.1`) are marked as prerelease
- CI pipeline (`ci.yml`) unchanged — continues to build `:latest` on push to `main` for continuous delivery

**Usage:**
```bash
git tag v1.0.0
git push --tags
# or: trigger workflow_dispatch via GitHub UI with version input
```

**Edge cases handled:**
- Duplicate tag push → idempotent (overwrites Docker tag)
- Pre-release tags → `:v1.0.0-rc.1` tag + no `:latest` update + prerelease flag in GitHub Release
- Failure mid-workflow → artifacts retained for 1 day for debugging

---

## File inventory

### Missing from original tmdb repo (intentionally)
- `.github/workflows/tmdb.yml` → superseded by monorepo `ci.yml`
- `.trunk/*` → optional linting configs (Phase 7)
- `testdata/mini_ratings.tsv.gz` → duplicate of plain `.tsv`, not needed
- `testdata/mini.title.akas.tsv.gz` → not referenced in code

### Missing from original integration-tests repo (intentionally)
- `.github/workflows/IT.yml` → superseded by monorepo `ci.yml`
- `.github/workflows/deploy.yml` → superseded by GitOps (FluxCD + Renovate in fleet-infra)

### Files in monorepo but half-finished (all fixed ✅)
| File | Problem | Fix |
|------|---------|-----|
| `.github/workflows/deploy.yml` | WireGuard SSH deploy (deprecated) | Removed — GitOps via FluxCD replaces it ✅ |
| `tests/e2e/playwright.config.ts` | `testDir` pointed into cypress/ dir | Changed to `./playwright` ✅ |
| `tests/e2e/package.json` | Cypress installed but unused | Removed Cypress, kept Playwright + Artillery ✅ |
| `apps/webapp/package.json` | Sentry version seeming mismatch | Verified correct alignment ✅ |
| `apps/webapp/Dockerfile` | Used Node 24 | Changed to Node 22 ✅ |
| `services/tmdb/Dockerfile` | `COPY . /app` was too broad | Scoped to `services/tmdb/` ✅ |
