# ADR: Server-side X-API-Key injection for admin import paths

| **Status** | Accepted |
| --- | --- |
| **Date** | 2026-10-04 |
| **Issue** | #44 — /admin websockets connection error: error triggering imports on admin site |

## Context

The admin SPA (`/admin` page) triggers data-import requests against `/tmdb/import/...`,
`/tmdb/index/...`, `/tmdb/dump/...`, and `/tmdb/redo/...`. These endpoints are protected by
Django's `require_admin_token` decorator, which checks the `X-API-Key` header against the
`ADMIN_API_KEY` environment variable. The frontend JS bundle must never hold this secret.

The `/admin` nginx location serves only static SPA files — it does **not** proxy to the backend.
Import requests originate from the SPA browser but are routed to `/tmdb/import/...` because
`getBackendUrl()` returns `/tmdb` in production. Therefore the header must be injected in the
`/tmdb/` proxy location, scoped precisely to admin-prefixed paths.

## Decision

Use nginx server-side header injection (Option B) rather than exposing `ADMIN_API_KEY` to the
frontend JS bundle.

A `map` on `$request_uri` matches `~^/tmdb/(import|index|dump|redo)/` and resolves to
`$ADMIN_API_KEY`; the default is an empty string, so nginx omits the header entirely for non-admin
paths. The `$ADMIN_API_KEY` variable is populated from the container environment via nginx's `env`
directive (injected by the Dockerfile at startup). The secret is sourced from the webapp chart's
Kubernetes Secret (`envFrom.secretRef`), identical to the existing `ADMIN_PASSWORD`/`SENTRY_DSN`
plumbing.

## Alternatives Considered

| Option | Trade-off | Verdict |
| --- | --- | --- |
| **A — Embed secret in frontend JS bundle** (`VITE_ADMIN_API_KEY`) | Simple one-line fix | **Rejected** — violates the security boundary; secret visible in browser bundle |
| **B — nginx server-side header injection** (chosen) | Requires nginx `map` + `env` directive | **Accepted** — secret stays server-side; precise path scoping |
| **C — Backend-side relaxation** (skip auth for same-origin) | No nginx changes | **Rejected** — CSRF surface; less secure |
| **D — Session-based auth** (`@login_required`) | Proper long-term | **Deferred** — significant refactor; out of scope for this issue |

## Consequences

### Positive
- **Secret isolation**: `ADMIN_API_KEY` never enters the JS bundle (build stage never sees it; runtime
  injection is server-side only).
- **Precise scoping**: Regex `~^/tmdb/(import|index|dump|redo)/` matches exactly the 17
  `require_admin_token` endpoints in `urls.py`; public endpoints (`/tmdb/view/`, `/tmdb/status`,
  `/tmdb/ws`, `/tmdb/genres`, `/tmdb/imdb/ratings`) receive no header — unaffected.
- **Fail-safe default**: Empty `$admin_api_key` → nginx omits header entirely (per nginx docs:
  "If the value of a header field is an empty string then this field will not be passed to a proxied
  server"), so missing/unset secret results in 401 on admin endpoints — never silent bypass.
- **No frontend/backend code changes** required.

### Negative / Operational Overhead
1. **Secret synchronization**: Both `charts/webapp/values.yaml` and `charts/tmdb/values.yaml` define
   `ADMIN_API_KEY: "REPLACE_ME"`. Fleet-infra (SOPS) must supply the **same** real value to both
   charts, or admin imports will 401. This is an operational synchronization point — documented in
   runbooks.
2. **Map regex maintenance**: If new admin endpoints are added under a different prefix (e.g.,
   `/tmdb/purge/`), the map regex in `app.conf` and `app.conf.template` must be updated.
3. **`env` directive context**: The `env` directive is `main`-context only; the Dockerfile's
   `sed -i '1i env ADMIN_API_KEY;'` injects it at line 1 of the container's nginx.conf, while the
   local-dev `nginx.conf` has it manually added at line 2.
4. **envsubst allow-list**: The `envsubst '$TMDB_UPSTREAM'` allow-list must **not** include
   `$ADMIN_API_KEY` — the variable must remain an nginx runtime variable, substituted only by
   nginx's `env` directive, not by `envsubst`.

## Related
- [Engineering Brief: Admin API Key Injection](../ENGINEERING_BRIEF_ADMIN_API_KEY_INJECTION.md)
