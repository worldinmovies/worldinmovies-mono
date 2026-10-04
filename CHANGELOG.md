# Changelog

All notable changes to this project are documented via conventional commits and
auto-generated chart versioning. This file records notable decisions for humans.

## [unreleased]

### Added
- **nginx server-side `X-API-Key` header injection** for admin import paths
  (`/tmdb/import/`, `/tmdb/index/`, `/tmdb/dump/`, `/tmdb/redo/`) via a `map $request_uri
  $admin_api_key` block and `proxy_set_header X-API-Key $admin_api_key` in the `/tmdb/` nginx
  location. The secret is sourced from the webapp chart Kubernetes Secret
  (`ADMIN_API_KEY` via `envFrom.secretRef`), never exposed to the frontend JS bundle
  (#44).
- `ADMIN_API_KEY` secret placeholder added to `charts/webapp/values.yaml`,
  `charts/worldinmovies/values.yaml` (`webapp.secrets`), and
  `charts/webapp/values.schema.json`.
- `env ADMIN_API_KEY;` directive added to `apps/webapp/nginx/nginx.conf` and Dockerfile
  `sed` injection for container parity.

### Fixed
- **401 Unauthorized** on admin data-import endpoints (`/tmdb/import/...`,
  `/tmdb/index/...`, `/tmdb/dump/...`, `/tmdb/redo/...`) caused by missing `X-API-Key`
  header. Requests originating from the `/admin` SPA now carry the header injected
  server-side by nginx (#44).
