# worldinmovies-mono — Status & Remaining Work

## ✅ Completed

| Area | Details |
|---|---|
| **Monorepo structure** | pnpm workspaces + TurboRepo orchestration, 3 workspaces: @worldinmovies/webapp, @worldinmovies/tmdb, @worldinmovies/e2e |
| **Webapp tests** | 151 tests across 18 files, all passing (Vitest + jsdom) |
| **Backend tests** | 31 scenarios / 180 steps across 4 features, all passing (behave-django + testcontainers) |
| **CI: frontend-test** | pnpm/action-setup v4, Node 22, `pnpm vitest run` |
| **CI: backend-test** | Python 3.12, pip install, `python manage.py behave` |
| **CI: build-tmdb** | Multi-arch (amd64 + arm64), push by digest, inline cache |
| **CI: merge-tmdb-manifest** | Merge amd64 + arm64 into multi-arch `:latest` |
| **Dockerfiles** | Both use root build context for pnpm monorepo compatibility |
| **Pre-commit hooks** | husky v9 + lint-staged → eslint --fix on staged .ts/.tsx |

## 🔴 Remaining Gaps

### 1. integration-test job uses stale Docker images
- **Problem**: The job has `needs: [backend-test]` but should wait for `merge-tmdb-manifest` so it tests the newly built image, not whatever `:latest` was on Docker Hub before the push
- **Fix**: Change dependency chain to `needs: [merge-tmdb-manifest]`

### 2. No webapp Docker build in CI
- **Problem**: `docker-compose.yml` references `seppaleinen/worldinmovies_webapp:latest` but CI never builds or pushes this image. Must be built locally with `pnpm build:docker:webapp`
- **Fix**: Add `build-webapp` CI job (parallel to `build-tmdb`), and make `integration-test` depend on both manifest jobs

### 3. `.dockerignore` may exclude test data needed for CI backend tests
- **Problem**: `.dockerignore` includes `services/tmdb/testdata/*.gz` — this is correct for Docker builds (test data isn't needed in production image), but the CI `integration-test` job copies `datasubset/*.json` directly, so no impact there
- **Status**: Not a real blocker, but worth noting the pattern

### 4. No auto-dependency update tooling
- **Problem**: No Renovate or Dependabot config. pnpm-lock.yaml is manually updated
- **Fix**: Add `renovate.json` or `.github/dependabot.yml`

## 🟡 Optional Improvements

### 5. E2E test runner consolidation
- Both Cypress and Playwright are installed side-by-side in `tests/e2e/`
- The `integration-test` CI job uses Cypress; the local `e2e:test` script uses Playwright
- Playwright config has `testDir: './cypress/playwright'` — tests live under a `cypress/` directory

### 6. Turbo remote caching
- No remote cache configured — CI builds from scratch every time
- Could add Vercel remote cache or GitHub Actions cache for turbo

### 7. TypeScript type checking in CI
- No `tsc --noEmit` step in CI for the webapp
- Could add `typecheck` job or step

## 🔧 How to Run

```bash
# Full test suite (parallel via turbo)
pnpm test

# Frontend only
pnpm test:frontend        # 151 vitest tests

# Backend only (requires Docker for testcontainers)
pnpm test:backend          # 31 behave scenarios

# E2E (requires docker-compose stack)
pnpm e2e:up               # Start all services
pnpm e2e:test             # Run Playwright tests
pnpm e2e:down             # Stop services

# Docker images
pnpm build:docker:tmdb    # Multi-arch TMDB image
pnpm build:docker:webapp  # Multi-arch webapp image

# Pre-commit hooks run automatically via husky
```
