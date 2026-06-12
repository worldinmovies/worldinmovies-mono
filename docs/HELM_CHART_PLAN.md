# Plan: Move Helm Charts into Monorepo + Publish to OCI

**Issue**: [#4](https://github.com/worldinmovies/worldinmovies-mono/issues/4) — "Create a helm chart"

## Decisions

| # | Question | Decision |
|---|----------|----------|
| 1 | OCI registry target | **GHCR** (`ghcr.io/worldinmovies/charts`) |
| 2 | Chart versioning | **Same as bitbase**: conventional commits → auto semver bump via `yq` in CI, commit with `[skip ci]`, tag `helm/{name}-X.Y.Z` |
| 3 | Flux in this repo | **No** — just pure Helm charts. fleet-infra stays as FluxCD source of truth; app HelmReleases there will reference OCI charts from GHCR |
| 4 | Secrets | **Placeholder values** in chart `values.yaml` (e.g., `REPLACE_ME`). Real SOPS-encrypted secrets stay in fleet-infra |
| 5 | Infra dependencies | **Optional sub-charts**: MongoDB (Bitnami) + RabbitMQ (Bitnami) as proper Helm dependencies with `condition` tags, default `enabled: false` |

## Current State

### fleet-infra (`~/workspace/personal/fleet-infra/flux/worldinmovies/`)
A Flux-managed Kubernetes deployment stack with **6 components**:

| Component | Type | Chart Type | Source |
|-----------|------|-----------|--------|
| `tmdb` | App (Django API) | **Local chart** (Chart.yaml, templates/, values.yaml) | fleet-infra repo |
| `tmdb-worker` | App (Celery worker) | **Local chart** (Chart.yaml, templates/, values.yaml) | fleet-infra repo |
| `webapp` | App (React frontend) | **Local chart** (Chart.yaml, templates/, values.yaml) | fleet-infra repo |
| `mongo` | Infra (MongoDB) | Upstream Bitnami chart via HelmRelease | bitnami Helm repo |
| `meilisearch` | Infra (Meilisearch) | Upstream chart via HelmRelease | meilisearch Helm repo |
| `rabbitmq` | Infra (RabbitMQ) | Upstream Bitnami chart via HelmRelease | bitnami Helm repo |

All secrets are encrypted with **SOPS/Age**.

### Monorepo deploy
Currently deploys via **Docker Compose** on a single home server (WireGuard SSH tunnel). **This is unchanged** — Helm charts are for the Kubernetes/Flux deployment path. Existing Docker Compose workflow will continue to work.

## Plan

### Phase 0: Prerequisites
- [ ] Install `helm` locally for chart development (`brew install helm`)
- [ ] Install `yq` locally: `brew install yq`
- [ ] Add `charts/` to `.dockerignore` (not needed for Docker builds)

### Phase 1: Directory Structure

```
charts/
  tmdb/
    Chart.yaml           ← version + mongodb/rabbitmq as optional deps
    values.yaml          ← image tag, infra URLs, placeholder secrets
    templates/
      deployment.yaml    ← ported from fleet-infra
      service.yaml       ← ported from fleet-infra
      environment-secrets.yaml
  tmdb-worker/
    Chart.yaml           ← same optional deps pattern
    values.yaml
    templates/
      deployment.yaml
      environment-secrets.yaml
  webapp/
    Chart.yaml           ← no infra deps (just needs a tmdb URL)
    values.yaml
    templates/
      deployment.yaml
      service.yaml
      ingress.yaml
      environment-secrets.yaml
```

No `infrastructure/` directory — mongo/meilisearch/rabbitmq Flux manifests stay in fleet-infra.

### Phase 2: Chart Dependencies (MongoDB + RabbitMQ as optional sub-charts)

For `tmdb` and `tmdb-worker` `Chart.yaml`:
```yaml
dependencies:
  - name: mongodb
    version: "18.7.1"
    repository: "https://charts.bitnami.com/bitnami"
    condition: mongodb.enabled
    alias: mongodb
  - name: rabbitmq
    version: "16.0.14"
    repository: https://charts.bitnami.com/bitnami"
    condition: rabbitmq.enabled
    alias: rabbitmq
```

In `values.yaml`:
```yaml
mongodb:
  enabled: false          # set true to bundle MongoDB with this release
  architecture: standalone
  persistence:
    size: 8Gi
  resources:
    requests:
      cpu: 250m
      memory: 4Gi

rabbitmq:
  enabled: false          # set true to bundle RabbitMQ with this release
  persistence:
    size: 2Gi
  resources:
    requests:
      cpu: 250m
      memory: 196Mi
```

**Note**: Both tmdb and tmdb-worker declare these deps independently. When deploying both, only one should enable bundled infra. The `condition` pattern makes this explicit — production deployments override with `mongodb.enabled=false` and point to existing services via env vars.

Webapp has no infra dependencies.

### Phase 3: Move & Adapt Application Charts

For each of the 3 charts:

- [ ] Copy chart source from `~/workspace/personal/fleet-infra/flux/worldinmovies/{name}/` to `charts/{name}/`
  - Include: `Chart.yaml`, `values.yaml`, `templates/*`
  - **Exclude**: `helmrelease.yaml`, `kustomization.yaml`, `secrets.yaml` (Flux-specific, stays in fleet-infra)
- [ ] Update `Chart.yaml`:
  - `version: 0.2.0` (bump from 0.1.0 to signal the move)
  - Add `home: https://github.com/worldinmovies/worldinmovies-mono`
  - Add `sources:` pointing to this repo
  - Add `icon:` (optional, e.g., `https://worldinmovies.labb.site/favicon.ico`)
- [ ] Update `values.yaml`:
  - Keep image references as `seppaleinen/worldinmovies_*` (same Docker Hub images)
  - Add `tag: latest` (will be overwritten at deploy time)
  - Add `secrets:` section with placeholder values (plain text, no SOPS)
  - Add `mongodb.enabled: false` and `rabbitmq.enabled: false` for tmdb/tmdb-worker
- [ ] Update `templates/deployment.yaml` for tmdb/tmdb-worker:
  - Make sure `MONGO_URL` and `RABBITMQ_URL` conditionally switch between bundled and external:
    ```
    {{- if .Values.mongodb.enabled }}
    - name: MONGO_URL
      value: {{ printf "%s-mongodb.%s.svc.cluster.local" .Release.Name .Release.Namespace }}
    {{- else }}
    - name: MONGO_URL
      value: {{ .Values.external.mongoURL }}
    {{- end }}
    ```
- [ ] Verify each chart locally: `helm dep update charts/{name}/ && helm lint charts/{name}/`

### Phase 4: Chart Publishing CI

Create `.github/workflows/publish-charts.yml` — **exact same logic as bitbase**:

**Trigger**: Push to `main` with changes to `charts/**`
**Concurrency**: Single-job (prevent tag/push races)
**Process per chart**:
1. `yq '.version' charts/{name}/Chart.yaml` → read current version
2. `helm lint charts/{name}/`
3. `helm dep update charts/{name}/` (download sub-chart tarballs)
4. `helm package charts/{name}/ --version $VERSION --app-version $VERSION`
5. `helm push` to `oci://ghcr.io/worldinmovies/charts/{name}:$VERSION`
6. Compute bump type from commit message (`BREAKING CHANGE` → major, `feat:` → minor, else → patch)
7. `yq -i ".version = \"$NEW_VERSION\"" charts/{name}/Chart.yaml`
8. Commit `chore(helm): bump {name} chart to $NEW_VERSION [skip ci]`
9. Tag `helm/{name}-$NEW_VERSION`

**Permissions**: `contents: write`, `packages: write`

**Authentication**: `GITHUB_TOKEN` via `helm registry login ghcr.io`

**Guard condition**: Only run on `github.ref == 'refs/heads/main'`

### Phase 5: Update fleet-infra

After first successful publish, update `~/workspace/personal/fleet-infra/`:

- [ ] Add a `HelmRepository` resource in `flux-system/`:
  ```yaml
  apiVersion: source.toolkit.fluxcd.io/v1
  kind: HelmRepository
  metadata:
    name: ghcr-worldinmovies
    namespace: flux-system
  spec:
    type: oci
    interval: 1h
    url: oci://ghcr.io/worldinmovies/charts
  ```
- [ ] Update `flux/worldinmovies/{tmdb,tmdb-worker,webapp}/helmrelease.yaml`:
  - `chart: flux/worldinmovies/{name}` → `chart: {name}` (no path prefix, since sourceRef resolves)
  - `sourceRef.kind: GitRepository` → `sourceRef.kind: HelmRepository`
  - `sourceRef.name: flux-system` → `sourceRef.name: ghcr-worldinmovies`
- [ ] Remove app chart files from fleet-infra: `Chart.yaml`, `templates/`, `values.yaml`
- [ ] Keep: `helmrelease.yaml`, `kustomization.yaml`, `secrets.yaml`
- [ ] Keep mongo/meilisearch/rabbitmq as-is (they already use upstream HelmRepositories)

### Phase 6: Validation

- [ ] `helm lint` passes for all 3 charts
- [ ] `helm dependency update` + `helm dependency build` works for tmdb and tmdb-worker
- [ ] CI dry-run: push to a feature branch, verify the publish workflow can lint/package (push step skipped unless on main)
- [ ] fleet-infra HelmRelease can reconcile after charts are published
- [ ] Existing `pnpm test` still passes
- [ ] Existing `deploy.yml` (Docker Compose) still works unchanged
- [ ] Document in `AGENTS.md` where charts live and how publishing works

## Future Considerations (Not in Scope for this Issue)

- Chart testing (`helm test` / chart-testing `ct`)
- Migrating home server from Docker Compose to Kubernetes
- Dependabot/Renovate for Helm chart dependency updates
- Chart signing with Cosign
- Renovate for the chart's AppVersion to automatically track new release tags
- Automated updating of fleet-infra HelmRelease image tags via Flux ImageUpdateAutomation

## Acceptance Criteria

- [ ] `charts/tmdb/`, `charts/tmdb-worker/`, `charts/webapp/` — three valid, lintable Helm charts
- [ ] MongoDB + RabbitMQ as optional sub-chart dependencies (`mongodb.enabled: false` by default)
- [ ] Placeholder secrets in `values.yaml` (no SOPS, no real secrets)
- [ ] CI workflow packages and publishes charts to `ghcr.io/worldinmovies/charts` on push to `main`
- [ ] Chart version auto-bumped from commit message (bitbase-style conventional commits)
- [ ] fleet-infra HelmReleases updated to reference OCI charts from GHCR
- [ ] Chart templates conditionally switch between bundled and external infra
- [ ] All existing monorepo tests and workflows unchanged
