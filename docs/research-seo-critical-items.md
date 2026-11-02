# Research Brief: Complete Critical SEO/AEO Audit Items

## Issue
[#1 - SEO & AEO & GEO Audit](https://github.com/worldinmovies/worldinmovies-mono/issues/1)

## Context
The full audit is documented in `docs/seo-aeo-audit-plan.md`. All 6 phases are complete with findings. Two **Critical** items remain unimplemented:
- **#3: Create XML sitemap** — Static sitemap exists (`public/sitemap.xml`) with only 5 static URLs. No dynamic movie routes.
- **#4: Add FAQ section** — No FAQ page/component exists.

## What to Build

### 1. Dynamic XML Sitemap (split, not monolithic)
- **Not** `vite-plugin-sitemap` — that plugin is overkill and can't query our database.
- Write a **Node.js build script** (`scripts/generate-sitemap.js`) that:
  - Connects to MongoDB directly (using existing connection string/env vars from the Django backend)
  - Fetches all movie IDs from the database
  - Generates a `sitemap.xml` **index** pointing to split sitemaps (e.g. `sitemap-movies-001.xml`, `sitemap-movies-002.xml`, ...), capped at ~1000 URLs per file (Google's recommended max)
  - Also includes static routes: `/`, `/watchlist`, `/analytics`, `/privacy`, `/about`, `/faq`, `/import`
  - Outputs to `apps/webapp/public/`
- Hook into `apps/webapp/package.json` build script so it runs before `vite build`

### 2. FAQ Page
- New route `/faq` in `App.tsx`
- New component `pages/FAQ.tsx` with:
  - World cinema FAQ content (at least 5-8 relevant Q&As)
  - Uses existing `useSEO` hook with page-specific title/description
  - `structuredData` with `FAQPage` schema (JSON-LD) — the `useSEO` hook already supports this via the `structuredData` parameter
- Lazy-load the page in `App.tsx` (follow existing pattern)

### 3. Update robots.txt
- Reference `sitemap.xml` in `public/robots.txt`

## Constraints
- Follow existing patterns: lazy-loaded pages, `useSEO` hook, Shadcn/UI components
- The `useSEO` hook already supports `structuredData` — use it for FAQPage schema
- Use `pnpm` for package management (NOT npm/yarn)
- Run `pnpm test` to validate; run `pnpm typecheck` in `apps/webapp`
- The MongoDB connection string is available via env vars used by the Django backend — check `services/tmdb/` for how it's configured

## Expected Output
- `scripts/generate-sitemap.js` — sitemap generation script
- `apps/webapp/package.json` — build script updated
- `apps/webapp/src/App.tsx` — `/faq` route added
- `apps/webapp/src/pages/FAQ.tsx` — FAQ page with structured data
- `apps/webapp/public/robots.txt` — references sitemap.xml
- Tests pass, typecheck passes

## What NOT to do
- Do NOT use vite-plugin-sitemap
- Do NOT try to put all movie URLs in a single sitemap file
- Do NOT use npm/yarn
