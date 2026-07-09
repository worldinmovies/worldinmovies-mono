# E2E Implementation Reference

Compiled from codebase exploration 2026-07-08. Use this when writing the new Playwright test files.

---

## API Endpoints (tmdb service, port 8020)

| Endpoint | Method | Purpose | Query Params |
|----------|--------|---------|-------------|
| `/view/random/best/{skip}` | GET | Main grid feed | `seed`, `genres`, `limit` (default 8) |
| `/view/best/{country_code}` | GET | Country-filtered grid | `skip`, `limit` (default 10) |
| `/movie/{id}` | GET | Movie detail (Movie model, `movie` collection) | — |
| `/search/movies/{query}` | GET | Meilisearch proxy → `movies` index | — |
| `/status` | GET | Import status | — |
| `/health` | GET | Health check | — |
| `/genres` | GET | Distinct genre names | — |
| `/index/movies` | POST | Trigger Meilisearch re-index (admin) | Auth: X-API-Key |

## MongoDB Collections

### `discoverymovie` (DiscoveryMovie model)
Populated by seed script for grid display. Fields:
```
_id: int (primary key)
imdb_id: string
original_title: string
english_title: string
poster_path: string
vote_average: float
vote_count: int
estimated_country: string          ← used for country filter
year: string
director: string
genres: [string]                    ← used for genre filter
weighted_rating: float
overview: string
```

### `movie` (Movie model — full TMDB data)
Pre-populated by CI from `datasubset/tmdb.movie.json` and `tmdb.flattened_movie.json`.
Used by `/movie/{id}` endpoint. Has embedded documents (credits, images, etc.).

---

## Component Tree

```
pages/
  Index.tsx                     ← "/" route
    HeroSection                  ← first visit only (localStorage: heroViewed)
    MovieGrid                    ← main content
      MovieSearch                ← search input + suggestions
      MovieFilters
        CountryFilter            ← Shadcn Select
        DropdownMenu (genre)     ← "All Genres" button
        DropdownMenu (seen)      ← "All" / "Seen" / "Unseen"
        DropdownMenu (watchlist) ← "All Movies"
      MovieCard[]                ← grid of cards
      MovieDetailModal           ← Radix Dialog
  import/Import.tsx              ← "/import"
  About.tsx                      ← "/about"
  Watchlist.tsx                  ← "/watchlist"
  Admin.tsx                      ← "/admin"
  NotFound.tsx                   ← 404
```

---

## Key Selectors

### Homepage
| Element | Selector |
|---------|----------|
| Search input | `input[placeholder="Search by title, director, or country..."]` |
| Featured Films heading | `page.getByText('Featured Films')` |
| Movie cards | `[class*="grid grid-cols-2"]` — cards are `<div>`s with movie data |
| Country filter trigger | `role="combobox"` button with placeholder text "All Countries" |
| Genre filter trigger | Button containing text "All Genres" |
| Loading spinner | `Loader2` icon with text "Discovering more films..." |

### Movie Detail Modal
| Element | Selector |
|---------|----------|
| Dialog | `role="dialog"` (Radix Dialog) |
| Title | `DialogTitle` — text in the dialog |
| Year | Shows as `Calendar` icon + year text |
| Rating | Shows as `Star` icon + rating number |
| Director | `User` icon + "Directed by {name}" |
| Seen toggle | `role="button"` with text "Mark as Seen" or "Seen" |
| Close button | `X` icon button inside Dialog |
| Prev/Next | `ChevronLeft` / `ChevronRight` buttons |

### Search Suggestions
| Element | Selector |
|---------|----------|
| Suggestions container | `div.absolute` below search input, inside `Command` component |
| Suggestion item | `role="option"` (CommandItem) with `cursor-pointer` class |
| Poster in suggestion | `img[src*="image.tmdb.org"]` at 48x64 (w12 h16) |
| Title in suggestion | `p.font-medium` inside suggestion |
| Year in suggestion | `p.text-sm.text-muted-foreground` inside suggestion |

### Navbar
| Element | Selector |
|---------|----------|
| Logo + title | `a[href="/"]` containing `Film` icon + "World in Movies" text |
| Nav links (desktop) | `.hidden.md:flex` container with `a` elements |
| Home link | `a[href="/"]` with text "Home" (desktop) or hamburger menu (mobile) |
| Import link | `a[href="/import"]` with text "Import" |
| About link | `a[href="/about"]` with text "About" |
| Watchlist link | `a[href="/watchlist"]` with text "Watchlist" |
| Admin link | `a[href="/admin"]` with text "Admin" |
| Analytics link | Conditional — only visible when seenMovies.length > 0 |
| Mobile menu | `button[aria-label="Toggle menu"]` — hamburger icon |

### Import Page
| Element | Selector |
|---------|----------|
| Page title | `h1` with text "Import Your Movies" |
| Card: IMDb | CardTitle heading with text "Import from IMDb" |
| Card: Trakt.tv | CardTitle heading with text "Import from Trakt.tv" |
| Card: Letterboxd | CardTitle heading with text "Import from Letterboxd" |
| Description text | `p` with "Import your watched movies from various platforms" |
| Connect Trakt button | Button with text "Connect to Trakt.tv" |

### About Page
| Element | Selector |
|---------|----------|
| Page title | `h1` with text "About World in Movies" |
| Subtitle | `p` with text "A passion project for film enthusiasts..." |
| Section headings | `h2` with "Our Mission", "What We Offer" |

### Watchlist Page (empty)
| Element | Selector |
|---------|----------|
| Page title | `h1` with text "My Watchlist" |
| Empty heading | `h2` with text "Your watchlist is empty" |
| Empty description | `p` with text "Start adding movies you want to watch..." |

### 404 Page
| Element | Selector |
|---------|----------|
| 404 heading | `h1` with text "404" |
| Message | `p` with text "Oops! Page not found" |
| Home link | `a[href="/"]` with text "Return to Home" |

---

## URL Patterns

The frontend uses `getBackendUrl()` from `@/lib/config` to determine the backend URL.
In the Docker stack, this resolves to `http://tmdb:8020` (internal) or `http://localhost:8020` (from host).
The frontend is served at `http://localhost:80` (VITE_WEBAPP_PORT=80).

Frontend Vite proxy routes `/tmdb/*` → TMDB_UPSTREAM (tmdb:8020) in dev, but in production Docker build, the webapp container's nginx proxies `/tmdb/` → backend.

Routes:
- `/` → Index page (HeroSection + MovieGrid)
- `/import` → Import page
- `/about` → About page
- `/watchlist` → Watchlist page
- `/admin` → Admin page
- `/trakt-import` → Trakt import flow
- `/analytics` → Analytics (only shown when seen movies exist)
- `/*` → 404 NotFound page

---

## Data Flow

1. **Index page loads** → HeroSection (first time) OR MovieGrid
2. **MovieGrid mounts** → `useEffect` calls `loadMoreMovies(seed, null, 0, 'all', true)`
3. → `fetch()` to `/view/random/best/0?seed=...&genres=&limit=8`
4. → Backend runs aggregation on `discoverymovie` collection
5. → Returns array of DiscoveryMovie docs → `transferDiscoverMovie()` maps to Movie model
6. → Renders MovieCard for each movie
7. **Scroll down** → IntersectionObserver triggers more: `/view/random/best/8?seed=X&limit=8`
8. **Country select** → `loadMoviesForCountry('SE')` → `/view/best/SE?skip=0&limit=10`
9. **Genre click** → `loadMoreMovies(seed, null, 0, 'Drama', true)` → `/view/random/best/0?seed=X&genres=Drama&limit=8`
10. **Card click** → `fetchMovieDetails(id)` → `/movie/{id}` → falls back to grid data if 404

---

## Seed Data (10 movies)

| _id | Title | Country | Genres | Director |
|-----|-------|---------|--------|----------|
| 1 | Ariel | FI | Drama, Comedy | Aki Kaurismäki |
| 2 | Seven Samurai | JP | Action, Drama | Akira Kurosawa |
| 3 | The Seventh Seal | SE | Drama, Fantasy | Ingmar Bergman |
| 4 | Amélie | FR | Comedy, Romance | Jean-Pierre Jeunet |
| 5 | Cinema Paradiso | IT | Drama | Giuseppe Tornatore |
| 6 | Parasite | KR | Drama, Thriller | Bong Joon-ho |
| 7 | The Godfather | US | Drama, Crime | Francis Ford Coppola |
| 8 | In the Mood for Love | HK | Drama, Romance | Wong Kar-wai |
| 9 | Oldboy | KR | Action, Thriller | Park Chan-wook |
| 10 | Fanny and Alexander | SE | Drama | Ingmar Bergman |

Countries: FI, JP, SE, FR, IT, KR, US, HK
Genres: Drama, Comedy, Action, Romance, Crime, Fantasy, Thriller

---

## seed.sh Environment Variables

```
MONGO_HOST=localhost          # MongoDB host
MONGO_USER=seppa              # MongoDB user
MONGO_PASS=password            # MongoDB password
MONGO_DB=tmdb                  # MongoDB database
MONGO_COLLECTION=discoverymovie  # MongoDB collection
MEILI_HOST=localhost           # Meilisearch host
MEILI_PORT=7700               # Meilisearch port
MEILI_KEY=***REMOVED***
```

From container network: `HOST_PREFIX=container ./seed.sh`
From host: `./seed.sh`

---

## Meilisearch Document Schema

Documents pushed to `movies` index:
```json
{
  "id": 1,
  "title": "Ariel",
  "original_title": "Ariel",
  "alternative_titles": [],
  "overview": "...",
  "directors": ["Aki Kaurismäki"],
  "weighted_rating": 7.0,
  "vote_average": 7.2,
  "vote_count": 200,
  "guessed_country": "FI",
  "original_language": "fi",
  "poster": "/ojDg0PGvs6R9xYFodRct2kdI6wC.jpg",
  "year": "1988"
}
```

Frontend SearchHit interface expects:
```
id, title, estimated_country, overview, directors[],
weighted_rating, guessed_country, original_title, poster, year
```

---

## Movie Model (frontend)

```typescript
interface Movie {
  id: number;
  title: string;
  original_title: string;
  poster: string;
  rating: number;
  year: string;
  country: string;
  countryCode: string;
  description: string;
  director: string;
  genres: string[];
}
```

Mapped from DiscoveryMovie via `transferDiscoverMovie()`:
```
id ← _id
title ← english_title
original_title ← original_title
poster ← poster_path
rating ← vote_average
year ← year
country ← estimated_country (via countryData lookup)
countryCode ← estimated_country
description ← overview
director ← director
genres ← genres
```

---

## Docker Compose (tests/e2e)

| Service | Container name | Host port | Notes |
|---------|---------------|-----------|-------|
| mongo | mongo | 27017 | User: seppa / password, authSource=admin (SCRAM-SHA-256) |
| redis | redis | — | Internal only |
| rabbitmq | rabbitmq | 15672 (mgmt) | User: seppa / password |
| meilisearch | (auto) | 7700 | Key: ***REMOVED*** |
| tmdb | tmdb | 8020 | Django hypercorn ASGI |
| tmdb-worker | tmdb-worker | — | Celery worker |
| webapp | (auto) | ${VITE_WEBAPP_PORT} | Default 80 |

---

## CI Integration Test Flow (ci.yml)

1. `docker compose up -d` (with TMDB_IMAGE and WEBAPP_IMAGE from build step)
2. Copy `datasubset/tmdb.movie.json` and `tmdb.flattened_movie.json` into mongo container
3. Run `wait_until_running.sh`
4. `mongoimport` both JSON files into `movie` collection
5. Trigger Meilisearch index via `curl -X POST http://localhost:8020/index/movies`
6. Poll Meilisearch: `curl http://localhost:8020/search/movies/ariel` until hits appear
7. `pnpm e2e:test`
8. K6 smoke test

**To add:** After step 5, run `./seed/seed.sh` to populate `discoverymovie` collection + push to Meilisearch directly.

---

## Console / Logs

- SPA mode: all routes handled by react-router. Direct URL access (`/about`, `/import`, etc.) works via nginx `try_files` fallback to `index.html`.
- 404 page is a React component rendered by react-router for unmatched routes, NOT an nginx error page.
- HeroSection stores `heroViewed: 'true'` flag in localStorage on first view. Subsequent visits skip hero.
- Seen/unseen state persisted in localStorage under key `seenMovies` as JSON array.
- Watchlist state persisted under key `watchlist` as JSON array of `{ movie: Movie, tag: string }`.
- Custom events: `seenMoviesChanged` (detail: Movie[]), `watchlistChanged` (detail: WatchlistItem[]).
