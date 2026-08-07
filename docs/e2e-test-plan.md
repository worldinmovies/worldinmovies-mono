# E2E Test Plan — Issue #25

## Goal

Replace the 6 broken Playwright test files with a clean, flow-based E2E suite that tests real user journeys against a seeded database.

## Architecture

```
tests/e2e/
├── seed/
│   ├── seed-data.json      ← Easy-to-edit list of DiscoveryMovie records
│   └── seed.sh              ← Script: mongoimport + Meilisearch index
├── playwright/
│   ├── discovery.spec.ts    ← Homepage grid, filters, seen/unseen
│   ├── search.spec.ts       ← Search suggestions, modal from search
│   ├── navigation.spec.ts   ← Navbar, import page, about, watchlist
│   └── api-smoke.spec.ts    ← Real API endpoint contract checks
├── artillery/
│   └── playwright-flows.spec.ts  ← Keep as-is (load testing)
├── docker-compose.yml
├── playwright.config.ts
└── .env
```

**Old files deleted:** `mobile-tests.spec.ts`, `movie-interactions.spec.ts`, `navigation.spec.ts`, `search-tests.spec.ts`, `api-tests.spec.ts`, `api-contract-tests.spec.ts`

## Seed Data

A single JSON file (`seed-data.json`) with ~10 DiscoveryMovie records. Each entry is a real movie with:

```json
{
  "_id": 1,
  "original_title": "Seven Samurai",
  "english_title": "Seven Samurai",
  "estimated_country": "JP",
  "year": "1954",
  "director": "Akira Kurosawa",
  "genres": ["Action", "Drama"],
  "vote_average": 8.5,
  "vote_count": 3400,
  "weighted_rating": 8.3,
  "overview": "...",
  "poster_path": "/8OKmW5MkG1bPV2K2nLxYq0MFsI.jpg",
  "imdb_id": "tt0047478"
}
```

Coverage:

| Country | Movies | Genres |
|---------|--------|--------|
| FI | Ariel | Drama, Comedy |
| JP | Seven Samurai | Action, Drama |
| SE | The Seventh Seal, Fanny and Alexander | Drama, Fantasy |
| FR | Amélie | Comedy, Romance |
| IT | Cinema Paradiso | Drama |
| KR | Parasite, Oldboy | Drama, Thriller, Action |
| US | The Godfather | Drama, Crime |
| HK | In the Mood for Love | Drama, Romance |

**Extending:** To add more movies, just append to `seed-data.json` — no schema changes needed. Run `seed.sh` again.

## Seed Data

Single source of truth: `seed/seed-data.json` — array of DiscoveryMovie records.
The seed script transforms this into Meilisearch format.

### Meilisearch integration

The seed script (`seed.sh`) does three things:

1. **MongoDB** — `mongoimport` into `discoverymovie` collection
2. **Meilisearch settings** — Create/update the `movies` index with correct searchable/filterable/sortable attributes
3. **Meilisearch documents** — Transform seed data via `jq` and push to `movies` index

This catches regressions in both MongoDB query paths and Meilisearch search/indexing in future version upgrades.

```bash
# 1. mongoimport DiscoveryMovie records (upsert mode, safe to re-run)
# Uses the stack fixture defaults (see tests/e2e/.env.example); override via env vars
docker exec -i mongo mongoimport -u "${MONGO_USER:-devmongo}" -p "${MONGO_PASS:-devmongo-pass}" \
  --db tmdb --collection discoverymovie --mode upsert \
  --jsonArray < seed-data.json

# 2. Configure Meilisearch index settings
curl -X PATCH "http://localhost:7700/indexes/movies/settings" \
  -H "Authorization: Bearer $MEILI_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "searchableAttributes": ["title","original_title","alternative_titles","directors"],
    "filterableAttributes": ["guessed_country","original_language"],
    "sortableAttributes": ["weighted_rating","vote_average","vote_count"],
    "displayedAttributes": ["id","title","original_title","overview","directors",
      "weighted_rating","vote_average","vote_count","guessed_country",
      "original_language","poster","year"]
  }'

# 3. Push documents (transformed via jq)
jq '{id: ._id, title: .english_title, original_title: .original_title,
  alternative_titles: [], overview: .overview, directors: [.director],
  weighted_rating: .weighted_rating, vote_average: .vote_average,
  vote_count: .vote_count, guessed_country: .estimated_country,
  original_language: "en", poster: .poster_path, year: .year}' \
  seed-data.json | jq -s '.' | \
curl -X POST "http://localhost:7700/indexes/movies/documents" \
  -H "Authorization: Bearer $MEILI_KEY" \
  -H "Content-Type: application/json" \
  -d @-
```

## Flow-Based Test Scenarios

### 1. `discovery.spec.ts` — Homepage & Movie Grid (3 tests)

| # | User action | Assertion |
|---|------------|-----------|
| 1.1 | Visit `/` | Search input visible, Featured Films heading visible |
| 1.2 | Wait for grid to load | Movie cards rendered with titles/countries visible |
| 1.3 | Click country filter → select "Sweden" | Grid updates to show only Swedish films |
| 1.4 | Click genre filter → select "Drama" | API call includes `genres=Drama`, grid updates |
| 1.5 | Click first movie card | Modal opens with title, rating, year, director, "Mark as Seen" button |
| 1.6 | Click "Mark as Seen" | Button changes to "Seen" |
| 1.7 | Close modal → reopen same movie | Button persists as "Seen" |

### 2. `search.spec.ts` — Movie Search (3 tests)

| # | User action | Assertion |
|---|------------|-----------|
| 2.1 | Type "Ariel" in search | Suggestions dropdown appears with matching movie + year |
| 2.2 | Click suggestion | Modal opens with movie title, overview |
| 2.3 | Type partial "Sam" | "Seven Samurai" appears in suggestions |

### 3. `navigation.spec.ts` — Site Navigation (4 tests)

| # | User action | Assertion |
|---|------------|-----------|
| 3.1 | Click navbar "Import" link | URL `/import`, h2 contains "Import" |
| 3.2 | Click navbar "About" link | URL `/about`, h1 "About World in Movies" |
| 3.3 | Click navbar logo | Returns to `/` |
| 3.4 | Visit `/watchlist` | Empty state message visible |
| 3.5 | Visit `/admin` | Admin page renders |
| 3.6 | Visit `/nonexistent` | 404 page renders |

### 4. `api-smoke.spec.ts` — API Contract (4 tests, real requests)

| # | Endpoint | Assertion |
|---|----------|-----------|
| 4.1 | `GET /status` | 200, has `total`, `fetched`, `percentageDone` |
| 4.2 | `GET /genres` | 200, returns string array |
| 4.3 | `GET /movies/2,5` | 200, returns array with movie objects (id, title) |
| 4.4 | `GET /view/best/US` | 200, returns array (may be empty if no DiscoveryMovie for US) |

## Test Infrastructure

- All tests run against the existing `docker-compose.yml` stack
- `seed.sh` runs once during test setup (after `wait_until_running.sh`)
- Tests use `page.goto('/')` with `baseURL` pointing to webapp (port 80)
- Browsers: chromium only for speed (same rendering engine as CI)
- Mobile viewport: one `test.use({ viewport: { width: 390, height: 844 } })` per flow file to catch responsive breakage

## Execution Order

```bash
# In CI (already exists, minimal change):
docker compose up -d
docker cp seed/seed-data.json mongo:/
docker exec mongo mongoimport ...  # import to discoverymovie
./seed/seed.sh                     # import + Meilisearch index
pnpm e2e:test                      # playwright test

# Local dev:
pnpm e2e:up                        # docker compose up -d
pnpm e2e:seed                      # runs seed.sh
pnpm e2e:test                      # playwright test
pnpm e2e:down                      # cleanup
```

## Files to Create

| File | Action |
|------|--------|
| `docs/e2e-test-plan.md` | This plan |
| `tests/e2e/seed/seed-data.json` | Create — 10 DiscoveryMovie records |
| `tests/e2e/seed/seed.sh` | Create — import + Meilisearch |
| `tests/e2e/pnpm/package.json` | Add `e2e:seed` script |
| `tests/e2e/playwright/discovery.spec.ts` | Create — homepage + filters + seen |
| `tests/e2e/playwright/search.spec.ts` | Create — search suggestions |
| `tests/e2e/playwright/navigation.spec.ts` | Create — nav links + pages |
| `tests/e2e/playwright/api-smoke.spec.ts` | Create — API contract |

## Files to Delete

| File | Reason |
|------|--------|
| `mobile-tests.spec.ts` | Replaced by `discovery.spec.ts` with mobile viewport |
| `movie-interactions.spec.ts` | Structurally broken (nested describe), replaced |
| `navigation.spec.ts` | Replaced by new `navigation.spec.ts` |
| `search-tests.spec.ts` | Replaced by new `search.spec.ts` |
| `api-tests.spec.ts` | Replaced by `api-smoke.spec.ts` |
| `api-contract-tests.spec.ts` | Merged into `api-smoke.spec.ts` |
