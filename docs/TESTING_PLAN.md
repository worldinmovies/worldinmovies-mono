# Testing Strategy — World in Movies

## Overview

This document defines the testing strategy for **World in Movies**, a full-stack application with:
- **Frontend**: React + Vite + React Native Web (Capacitive mobile app) — `globe-reel-gems/`
- **Backend**: Django + Celery + MongoDB + Meilisearch — `tmdb/`
- **Integration/E2E**: Playwright + Cypress + Artillery — `integration-tests/cypress/`

---

## Testing Pyramid

```
          ┌──────────────┐
          │    E2E Tests  │  ← Critical user flows, cross-system
          ├──────────────┤
          │ Integration   │  ← API contracts, worker tasks, external services
          ├──────────────┤
          │   Unit Tests  │  ← Pure functions, hooks, components, utils
          └──────────────┘
```

---

## 1. Unit Tests (Frontend — `globe-reel-gems/`)

**Framework**: Vitest + Testing Library React (already configured)

### Coverage Gaps

| File | What to Test |
|------|-------------|
| `src/lib/utils.ts` | `cn()` — merge clsx + twMerge with various inputs |
| `src/lib/config.ts` | Backend URL resolution logic for dev/prod/native |
| `src/lib/models.ts` | Type definitions (no logic, skip) |
| `src/hooks/useMovies.ts` | `loadMoreMovies`, `loadMoviesForCountry`, `fetchMovieDetails`, `shuffleArray`, `resetMovies`, error handling, BACKEND_URL fallback |
| `src/hooks/useWebSocket.ts` | Connection lifecycle, message handling, reconnection, `sendMessage`, `clearMessages`, mock mode |
| `src/hooks/useStatus.ts` | Fetch /status endpoint, error handling |
| `src/hooks/useSEO.ts` | SEO metadata generation |
| `src/hooks/use-toast.ts` | Toast state management |
| `src/hooks/use-mobile.tsx` | Mobile detection logic |
| `src/components/MovieCard.tsx` | Render, props, click handlers |
| `src/components/MovieGrid.tsx` | Grid layout, loading state |
| `src/components/MovieSearch.tsx` | Search input, debouncing, results display |
| `src/components/MovieDetailModal.tsx` | Modal open/close, data display |
| `src/components/HeroSection.tsx` | Hero rendering |
| `src/components/Flag.tsx` | Flag rendering |
| `src/components/CountryFilter.tsx` | Country dropdown logic |
| `src/components/Navbar.tsx` | Navigation links, menu toggle |
| `src/components/WorldMap.tsx` | Map rendering, country click |
| `src/components/FreeWorldMap.tsx` | Free map rendering |
| `src/components/Globe.tsx` | 3D globe rendering |
| `src/pages/Import.tsx` + import components | Import flow, file handling |
| `src/pages/Admin.tsx`, `Analytics.tsx`, `AdminGuard.tsx` | Admin features |

### Pattern for Component Tests
```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

describe('ComponentName', () => {
  it('renders correctly', () => { ... });
  it('handles user interaction', () => { ... });
  it('handles edge cases', () => { ... });
});
```

### Pattern for Hook Tests
```tsx
import { renderHook, act } from '@testing-library/react';

it('returns expected state', () => {
  const { result } = renderHook(() => useCustomHook());
  act(() => { /* trigger state change */ });
  expect(result.current).toBe(expected);
});
```

---

## 2. Unit Tests (Backend — `tmdb/`)

**Framework**: Django test framework (pytest or unittest)

### Coverage Gaps

| File | What to Test |
|------|-------------|
| `tmdb/apps/app/helper.py` | `convert_country_code()` — all mappings, edge cases |
| `tmdb/apps/app/helper.py` | `chunks()`, `buffer()`, `start_background_process()`, `log()`, `get_statics()` |
| `tmdb/apps/app/db_models.py` | `Movie.calculate_weighted_rating_bayes()` — Bayes formula with various inputs |
| `tmdb/apps/app/db_models.py` | `Movie.guess_country()` — all country guessing logic branches |
| `tmdb/apps/app/db_models.py` | `Movie.add_fetched_info()` — parsing TMDB response |
| `tmdb/apps/app/db_models.py` | `Movie.add_references()` — genre/language/country reference resolution |
| `tmdb/apps/app/db_models.py` | `Movie.to_json()` — serialization |
| `tmdb/apps/imdb/imdb_importer.py` | `parse_user_watched()` — CSV parsing, match logic |
| `tmdb/apps/letterboxd/letterboxd.py` | `parse_user_watched()` — Meilisearch matching, fallback strategies |
| `tmdb/apps/worker/celery_tasks.py` | `redo_countries()`, `import_imdb_ratings_task()`, `import_imdb_titles_task()`, `populate_discovery_movie_task()`, `index_movies()` |

### Pattern for Backend Unit Tests
```python
from django.test import TestCase
from apps.app.db_models import Movie
from apps.app.helper import convert_country_code

class CountryCodeConversionTest(TestCase):
    def test_known_mapping(self):
        self.assertEqual(convert_country_code('YU'), ['BA', 'HR', 'MK', 'CS', 'SI'])

    def test_identity(self):
        self.assertEqual(convert_country_code('US'), ['US'])
```

---

## 3. Integration Tests

### Backend API Tests (`tmdb/`)

**Framework**: Django test client + pytest

| Endpoint | What to Test |
|----------|-------------|
| `GET /import/status` | Returns total/fetched/percentage |
| `GET /view/best/<country>` | Returns movies for country, pagination |
| `GET /view/random/best/<n>` | Returns random movies with genre filter |
| `GET /movie/<id>` | Returns single movie details |
| `GET /genres` | Returns genre list |
| `POST /imdb/ratings` | CSV upload, parsing, matching |
| `POST /letterboxd/ratings` | CSV upload, Meilisearch matching |
| `GET /search/movies/<query>` | Meilisearch search |
| `GET /dump/genres`, `/dump/langs`, `/dump/countries` | Data dump endpoints |
| `GET /health/` | Health check endpoints |

### Worker Task Integration Tests

| Task | What to Test |
|------|-------------|
| `import_imdb_ratings_task` | Batch rating import, bayes calculation |
| `import_imdb_titles_task` | Alternative titles processing |
| `populate_discovery_movie_task` | DiscoveryMovie population from Movie documents |
| `index_movies` | Meilisearch indexing |

### WebSocket Integration Tests

| Component | What to Test |
|-----------|-------------|
| `tmdb/apps/app/websocket.py` | Connection, message flow, group broadcast, historical log replay |
| `globe-reel-gems/src/hooks/useWebSocket.ts` | Frontend WebSocket hook with real backend |

---

## 4. End-to-End Tests

**Framework**: Playwright (already in `integration-tests/cypress/playwright/`)

### Critical User Flows

| Flow | Steps |
|------|-------|
| **Home page load** | Navigate to `/`, verify title, hero section, world map |
| **Country navigation** | Click world map → click country → verify country page loads with movies |
| **Movie detail** | Click movie card → verify movie detail modal/page |
| **Movie filtering** | Apply country filter → verify filtered results |
| **Movie filtering** | Apply genre filter → verify filtered results |
| **Movie filtering** | Apply seen/unseen filter → verify results |
| **Search** | Enter search query → verify results appear |
| **Import flow** | Navigate to Import page → file upload → verify matching results |
| **Responsive** | Test key flows at mobile/tablet breakpoints (Capacitor native mode) |
| **WebSocket** | Verify real-time log messages appear on dashboard |

### E2E Test Pattern
```ts
import { test, expect } from '@playwright/test';

test('critical flow name', async ({ page }) => {
  await page.goto('/');
  // ... interaction steps
  await expect(page.locator('selector')).toHaveText('expected');
});
```

### Performance Tests (Artillery)
- Existing in `integration-tests/cypress/artillery/tmdb-scenarios.yml`
- Stress test `/view/best/` and `/view/random/best/` endpoints
- Validate response times under load

---

## 5. Test Organization

```
worldinmovies/
├── globe-reel-gems/
│   └── src/
│       ├── components/
│       │   └── *.test.tsx
│       ├── hooks/
│       │   └── *.test.ts
│       └── lib/
│           └── *.test.ts
├── tmdb/
│   └── apps/
│       └── app/
│           └── tests/
│               ├── test_helper.py
│               ├── test_models.py
│               ├── test_importer.py
│               └── test_api.py
└── integration-tests/
    └── cypress/
        ├── playwright/
        │   └── *.spec.ts
        └── artillery/
            └── tmdb-scenarios.yml
```

---

## 6. CI/CD Integration

### Frontend
```json
// globe-reel-gems/package.json
{
  "scripts": {
    "test": "vitest run",
    "test:ci": "vitest run --coverage"
  }
}
```

### Backend
```bash
# tmdb/
python manage.py test apps.app.tests
```

### Integration
```bash
# integration-tests/cypress/
npx playwright test
artillery run artillery/tmdb-scenarios.yml
```

---

## 7. Prioritized Test Creation Plan

### Phase 1: Core Logic (Unit)
1. `Movie.calculate_weighted_rating_bayes()` — Bayes formula
2. `Movie.guess_country()` — All country guessing branches
3. `convert_country_code()` — All mappings
4. `chunks()` / `buffer()` — Utility functions
5. `cn()` — Utility function
6. `config.ts` — Backend URL resolution

### Phase 2: Backend Workers (Integration)
7. `import_imdb_ratings_task()` — Batch processing
8. `populate_discovery_movie_task()` — Discovery population
9. `index_movies()` — Meilisearch indexing
10. `parse_user_watched()` (IMDB) — CSV parsing
11. `parse_user_watched()` (Letterboxd) — Meilisearch matching

### Phase 3: Frontend Hooks (Unit)
12. `useMovies` — All methods, error handling, fallback
13. `useWebSocket` — Connection lifecycle, message handling
14. `useStatus` — API fetch, error handling

### Phase 4: Frontend Components (Unit)
15. `MovieCard`, `MovieGrid`, `MovieSearch`, `MovieDetailModal`
16. `HeroSection`, `Flag`, `CountryFilter`, `Navbar`
17. `WorldMap`, `FreeWorldMap`, `Globe`

### Phase 5: E2E Critical Flows
18. Home page → Country navigation → Movie detail
19. All filter combinations (country, genre, seen/unseen)
20. Search functionality
21. Import flow (file upload)
22. Responsive breakpoints

---

## 8. Non-Goals

- Tests for UI framework components (shadcn/ui, Radix UI) — trust their test suites
- Tests for Capacitor native bridges — trust Capacitor's test suite
- Tests for Meilisearch server itself — integration tests cover our client usage
- Tests for MongoDB driver — integration tests cover our usage

---

## 9. Coverage Targets

| Tier | Target |
|------|--------|
| Unit (frontend) | ≥85% line coverage |
| Unit (backend) | ≥80% line coverage |
| Integration | All public APIs covered |
| E2E | All critical user flows covered |

---

## 10. Quick Start

```bash
# Frontend unit tests
cd globe-reel-gems && npm run test

# Backend unit tests
cd tmdb && python manage.py test apps.app.tests

# Integration tests (need running services)
cd integration-tests/cypress && npx playwright test

# E2E tests (need running app)
cd integration-tests/cypress && npx playwright test --ui
```
