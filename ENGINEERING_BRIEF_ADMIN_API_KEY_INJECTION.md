TRACE: devops-team-lead → devops-architect [SUCCESS]

STATUS: [SUCCESS]

SUMMARY:
The admin import 401 errors are caused by the frontend calling `/tmdb/import/...` endpoints without the `X-API-Key` header. The backend's `require_admin_token` decorator checks this header against the `ADMIN_API_KEY` environment variable. The fix injects `X-API-Key` server-side in nginx's `/tmdb/` proxy location ONLY for admin-prefixed paths (`/tmdb/import/*`, `/tmdb/index/*`, `/tmdb/dump/*`, `/tmdb/redo/*`), using a `map` on `$request_uri` that pulls the key from the `ADMIN_API_KEY` env var exposed via nginx's `env` directive. The secret is sourced from the webapp chart's Kubernetes Secret (injected via `envFrom.secretRef`), never exposed to the frontend JS bundle. No frontend or backend code changes required.

RATIONALE:
- The import requests originate from the admin SPA (`/admin` page) but target `/tmdb/import/...` because `getBackendUrl()` returns `/tmdb` in production. The `/admin` nginx location only serves static SPA files and does NOT proxy to the backend. Therefore, header injection MUST be in the `/tmdb/` proxy location.
- A `map` on `$request_uri` scopes the header injection precisely to admin-prefixed paths (`/tmdb/import/`, `/tmdb/index/`, `/tmdb/dump/`, `/tmdb/redo/`) — covering all `require_admin_token` endpoints from `urls.py` while leaving public endpoints (`/tmdb/view/`, `/tmdb/status`, `/tmdb/ws`, etc.) and the public `/tmdb/imdb/ratings` upload endpoint untainted.
- The secret is sourced from the existing K8s Secret infrastructure (same pattern as `ADMIN_PASSWORD`/`SENTRY_DSN`), never baked into the JS bundle.
- The `env ADMIN_API_KEY;` directive in nginx.conf's main context is required for nginx to expose the container env var as an nginx variable (`$ADMIN_API_KEY`) usable in `map`/`proxy_set_header`. Without it, nginx would fail config test with "unknown variable".
- `envsubst` in the Dockerfile entrypoint already handles `$TMDB_UPSTREAM`; adding `$ADMIN_API_KEY` to the allow-list ensures it is NOT substituted (so it stays as an nginx variable), while `TMDB_UPSTREAM` continues to be baked at runtime.

TECHNICAL PAYLOAD:

### Nginx Config Changes

**File: `apps/webapp/nginx/sites-enabled/app.conf.template`**

```diff
 map $http_upgrade $connection_upgrade { # WebSocket support
  default upgrade;
  '' '';
 }
 
+# Conditional X-API-Key injection for admin import paths.
+# The $ADMIN_API_KEY variable is populated from the container environment
+# via the nginx `env` directive (see nginx.conf / Dockerfile).
+# Non-admin paths get empty value → nginx omits the header entirely.
+map $request_uri $admin_api_key {
+    ~^/tmdb/(import|index|dump|redo)/   $ADMIN_API_KEY;
+    default                             "";
+}
 
 server {
     ...
     location /tmdb/ {
         proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
         proxy_set_header X-Forwarded-Proto  $scheme;
         proxy_set_header Host $host;
+        proxy_set_header X-API-Key $admin_api_key;
         # we don't want nginx trying to do something clever with
```

**File: `apps/webapp/nginx/sites-enabled/app.conf` (static reference — keep in sync)**

Same two additions as above (map block and `proxy_set_header X-API-Key $admin_api_key;` in `/tmdb/` location).

**File: `apps/webapp/nginx/nginx.conf` (local dev parity — NOT used in container)**

```diff
 user www-data;
+env ADMIN_API_KEY;
 worker_processes auto;
```

**File: `apps/webapp/Dockerfile`**

```diff
 RUN apk add --no-cache gettext openssl libcap && \
     adduser -D -u 1000 appuser && \
     setcap 'cap_net_bind_service=+ep' /usr/sbin/nginx && \
-    sed -i '/^user /d' /etc/nginx/nginx.conf
+    sed -i '/^user /d' /etc/nginx/nginx.conf && \
+    sed -i '1i env ADMIN_API_KEY;' /etc/nginx/nginx.conf
```

> **Note**: The `env ADMIN_API_KEY;` is inserted at line 1 of the container's nginx.conf (main context). This makes the `ADMIN_API_KEY` container env var (sourced from the K8s Secret via `envFrom.secretRef`) available as nginx variable `$ADMIN_API_KEY`, which the `map` uses. The Dockerfile's `envsubst '$TMDB_UPSTREAM'` remains unchanged — it only substitutes `$TMDB_UPSTREAM`, leaving `$ADMIN_API_KEY` and `$admin_api_key` untouched for nginx runtime resolution.

### Helm Chart Values Changes

**`charts/webapp/values.yaml`**

```diff
 secrets:
   SENTRY_DSN: "REPLACE_ME"
   ADMIN_PASSWORD: "REPLACE_ME"
+  # ADMIN_API_KEY is the shared secret the tmdb backend expects in the
+  # X-API-Key header on admin import endpoints. Injected by webapp nginx
+  # proxy ONLY for /tmdb/(import|index|dump|redo)/ paths. Server-side only;
+  # never exposed to the webapp JS bundle. Must match tmdb chart's ADMIN_API_KEY.
+  ADMIN_API_KEY: "REPLACE_ME"
```

**`charts/webapp/values.schema.json`**

```diff
         "ADMIN_PASSWORD": {
           "type": "string"
         }
+        "ADMIN_API_KEY": {
+          "type": "string"
+        }
```

**`charts/worldinmovies/values.yaml`**

```diff
 webapp:
   secrets:
     SENTRY_DSN: "REPLACE_ME"
     ADMIN_PASSWORD: "REPLACE_ME"
+    ADMIN_API_KEY: "REPLACE_ME"
```

> **No template changes needed**: `environment-secrets.yaml` already iterates `.Values.secrets` generically, and `deployment.yaml` already uses `envFrom.secretRef` generically. Adding `ADMIN_API_KEY` to `.Values.secrets` automatically creates the env var in the webapp container.

### Confirmation of Resolution

- Admin import requests (`/tmdb/import/*`, `/tmdb/index/*`, `/tmdb/dump/*`, `/tmdb/redo/*`) now carry `X-API-Key: <shared-secret>` injected by nginx.
- Backend `require_admin_token` sees `X-API-Key` == `ADMIN_API_KEY` env var → 200 OK.
- Public endpoints (`/tmdb/view/...`, `/tmdb/status`, `/tmdb/ws`, `/tmdb/genres`, `/tmdb/imdb/ratings` etc.) receive NO `X-API-Key` header → unaffected.
- WebSocket `/tmdb/ws` path excluded → websocket connectivity unchanged.
- `ADMIN_API_KEY` never enters the webapp JS bundle (build stage never sees it; runtime injection is server-side only).

### Other Infrastructure Changes

**None required.** No changes to Redis, RabbitMQ, MongoDB, Meilisearch, Dragonfly, cert-manager, Traefik, or backend code. The fix is purely nginx config + webapp Helm chart secret plumbing.

### Remaining Risks / Operational Notes

1. **Secret sync**: The webapp and tmdb charts each have their own `ADMIN_API_KEY` secret (both default to `REPLACE_ME`). Fleet-infra (SOPS) must supply the **same** real value to both charts, or imports will 401. This is an operational synchronization point — consider documenting in runbooks.

2. **Map regex maintenance**: If new admin endpoints are added under a different prefix (e.g., `/tmdb/purge/`), the map regex `~^/tmdb/(import|index|dump|redo)/` must be updated. Document this in the repo's `CONTRIBUTING.md` or operations guide.

3. **Empty secret behavior**: If `ADMIN_API_KEY` is unset/empty in the webapp container, the map injects empty header → backend returns 401 on admin endpoints. This is fail-safe behavior. Ensure fleet-infra populates the secret.

4. **Dockerfile envsubst**: Both the build-time (line 36) and runtime entrypoint (line 50) envsubst calls must include `$ADMIN_API_KEY`. The build-time one gets empty string (overwritten at runtime); the runtime one injects the real secret. Updating both keeps them consistent.

5. **WebSocket error in issue title**: The "websockets connection error" in the issue title appears to refer to the log stream on the admin page (`/ws`), which is unaffected by this change (no admin key injected on `/tmdb/ws`). If the WebSocket error persists after this fix, it's a separate issue (e.g., proxy protocol / firewall / ASGI config).

6. **No breaking changes**: The webapp chart version bump (per conventional commits) will trigger CI/CD image rebuild. Fleet-infra will pick up the new chart version and SOPS secret updates automatically on next reconcile.

IMPORTANT NOTES:
- The static `apps/webapp/nginx/sites-enabled/app.conf` is NOT used in the container (the Dockerfile uses the template + envsubst). It is updated here only for local-dev parity and repo hygiene.
- The `env` directive in nginx.conf is `main` context only (top-level). The Dockerfile `sed -i '1i ...'` correctly injects it at line 1.
- The `map` is placed at http level (top of template, alongside existing `$connection_upgrade` map) which is valid since the file is included inside the `http {}` block of nginx.conf.
- `proxy_set_header X-API-Key $admin_api_key;` with empty value → nginx omits the header (per nginx docs: "If the value of a header field is an empty string then this field will not be passed to a proxied server"). Non-admin paths get no header.