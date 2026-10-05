# ADR: Scheduled Meilisearch Reindex via Kubernetes CronJob

| **Status** | Accepted |
| --- | --- |
| **Date** | 2026-10-04 |
| **Issue** | #45 — run imports automatically on schedule |

## Context

The Meilisearch `movies` index must be refreshed periodically to reflect new movies, updated ratings, and corrected metadata from TMDB/IMDB imports. Previously, only Django cron (`django-crontab`) ran scheduled imports, but Meilisearch reindexing was manual.

The fix requires:
1. A new `index_meilisearch` management command that deletes all documents, updates settings, and dispatches Celery `index_movies` chunks.
2. A Kubernetes CronJob to run this command on a schedule.
3. Moving the conflicting `import_imdb_alt_titles` from Monday 00:00 to Tuesday 00:00 to avoid collision with `populate_discovery_movies`.

## Decision

Use a **management command + K8s CronJob** (enabled via Helm `cronJob.enabled`) rather than Celery Beat or `django-crontab` for the scheduled reindex.

The schedule is `0 3 * * 2` (every Tuesday 03:00) because cron has no native "first Tuesday" syntax; weekly is the practical cadence.

## Alternatives Considered

| Option | Trade-off | Verdict |
| --- | --- | --- |
| **A — Celery Beat periodic task** | Reuses existing worker; no new K8s resource | **Rejected** — Beat runs inside worker pod; if worker restarts/scaling happens, duplicate or missed runs; no visibility in K8s; harder to gate on worker readiness |
| **B — django-crontab (extend CRONJOBS)** | Same process as existing imports; simple | **Rejected** — Runs inside API pod; reindex dispatches Celery tasks that need worker; if API restarts mid-run, state lost; no K8s job history/retries; mixes concerns (API vs batch) |
| **C — K8s CronJob running management command** (chosen) | New K8s resource; separate pod | **Accepted** — Isolated execution; K8s handles retries (`backoffLimit: 3`), history (`failedJobsHistoryLimit: 3`), deadlines (`startingDeadlineSeconds: 300`); visible in `kubectl get cronjob`; reuses existing image/env/secrets; clean separation |

## Consequences

### Positive
- **Isolation**: Reindex runs in its own pod, not competing with API for resources.
- **Reliability**: K8s retry/backoff/history semantics; no lost runs on pod restart.
- **Observability**: `kubectl get cronjob`, `kubectl logs job/...` — standard K8s ops.
- **Resource control**: Dedicated `resources.requests` (cpu: 250m, memory: 512Mi) separate from API.
- **Security**: Reuses existing `envFrom.secretRef` (`{release}-env-secrets`); no new secret plumbing.
- **Deploy parity**: Enabled via Helm value (`cronJob.enabled`); CI publishes chart → fleet-infra/Flux reconciles.

### Negative / Operational Overhead
1. **Worker dependency**: CronJob dispatches Celery tasks; `tmdb-worker` must be running. Documented in values.yaml comment.
2. **Schedule approximation**: Cron cannot express "first Tuesday"; weekly at 03:00 Tue is the compromise.
3. **New K8s resource**: Adds a CronJob to the chart; must be validated in CI (`helm template`).
4. **Secrets sync**: Uses same secret as API — no new sync burden, but must exist.

## Related
- `services/tmdb/apps/api/management/commands/index_meilisearch.py` — management command
- `charts/tmdb/templates/cronjob.yaml` — CronJob template
- `charts/tmdb/values.yaml` — `cronJob` section (enabled, schedule, resources)
- `charts/worldinmovies/values.yaml` — mirrored under `tmdb.cronJob`