import { test, expect, type Route } from '@playwright/test';

const tmdbUrl = process.env.TMDB_URL || 'http://localhost:8020';

// ── Mock data ──────────────────────────────────────────────────────

interface MockSearchHit {
  id: number;
  title: string;
  estimated_country: string;
  overview: string;
  directors: string[];
  weighted_rating: number;
  guessed_country: string;
  original_title: string;
  poster: string;
  year: string;
}

const MOCK_SEARCH_HITS: MockSearchHit[] = [
  {
    id: 1,
    title: 'Ariel',
    estimated_country: 'FI',
    overview: 'A Finnish coal miner dreams of leaving the country.',
    directors: ['Aki Kaurismäki'],
    weighted_rating: 7.5,
    guessed_country: 'FI',
    original_title: 'Ariel',
    poster: '/test.jpg',
    year: '1988',
  },
  {
    id: 2,
    title: 'Four Rooms',
    estimated_country: 'US',
    overview: 'Four interlocking tales set in a fading hotel.',
    directors: ['Allison Anders', 'Alexandre Rockwell', 'Robert Rodriguez', 'Quentin Tarantino'],
    weighted_rating: 6.8,
    guessed_country: 'US',
    original_title: 'Four Rooms',
    poster: '/test2.jpg',
    year: '1995',
  },
];

/** Generate a SearchResponse JSON body */
function searchBody(hits: MockSearchHit[]) {
  return JSON.stringify({ hits });
}

/** Generate a BackendMovie JSON body */
function movieBody(id: number, hit: MockSearchHit) {
  return JSON.stringify({
    _id: hit.id,
    original_title: hit.original_title,
    year: parseInt(hit.year, 10),
    estimated_country: hit.estimated_country,
    vote_average: hit.weighted_rating,
    genres: [{ _id: 1, name: 'Drama' }],
    poster_path: '/test.jpg',
    overview: hit.overview,
    credits: {
      crew: hit.directors.map((name) => ({ job: 'Director', name })),
    },
  });
}

/** Route interceptor for search API */
async function interceptSearch(route: Route) {
  const url = route.request().url();
  const queryMatch = url.match(/\/search\/movies\/(.+?)(?:\?|$)/);
  const query = queryMatch ? decodeURIComponent(queryMatch[1]).toLowerCase() : '';

  // Simple substring matching against titles
  const hits = MOCK_SEARCH_HITS.filter((h) => h.title.toLowerCase().includes(query));

  await route.fulfill({ status: 200, contentType: 'application/json', body: searchBody(hits) });
}

/** Route interceptor for movie detail API */
async function interceptMovieDetail(route: Route) {
  const url = route.request().url();
  const idMatch = url.match(/\/movie\/(\d+)/);
  const id = idMatch ? parseInt(idMatch[1], 10) : 1;

  const hit = MOCK_SEARCH_HITS.find((h) => h.id === id) || MOCK_SEARCH_HITS[0];
  await route.fulfill({ status: 200, contentType: 'application/json', body: movieBody(id, hit) });
}

// ── Tests ──────────────────────────────────────────────────────────

test.describe('Movie search', () => {
  test('search input should be visible on homepage', async ({ page }) => {
    await page.goto('/');
    const searchInput = page.getByPlaceholder('Search by title, director, or country...');
    await expect(searchInput).toBeVisible();
    await expect(searchInput).toBeEnabled();
  });

  test('typing a movie title should show suggestions with metadata', async ({ page }) => {
    await page.route(/\/search\/movies\//, interceptSearch);
    await page.route(/\/movie\/\d+/, interceptMovieDetail);

    await page.goto('/');
    const searchInput = page.getByPlaceholder('Search by title, director, or country...');

    await searchInput.fill('Ariel');

    // Suggestion should appear with the movie title
    const suggestion = page.getByText('Ariel', { exact: true }).first();
    await expect(suggestion).toBeVisible({ timeout: 5000 });

    // Year metadata should be shown alongside
    await expect(page.getByText('1988').first()).toBeVisible();
  });

  test('clicking a search suggestion should open the movie detail modal', async ({ page }) => {
    await page.route(/\/search\/movies\//, interceptSearch);
    await page.route(/\/movie\/\d+/, interceptMovieDetail);

    await page.goto('/');
    const searchInput = page.getByPlaceholder('Search by title, director, or country...');

    await searchInput.fill('Ariel');

    const suggestion = page.getByText('Ariel', { exact: true }).first();
    await expect(suggestion).toBeVisible({ timeout: 5000 });

    // Click the suggestion — should open modal
    await suggestion.click();

    // Wait for the movie detail modal to appear with the movie title
    const modalTitle = page.getByRole('heading', { name: 'Ariel' });
    await expect(modalTitle).toBeVisible({ timeout: 10000 });
  });

  test('search should return results for partial title matches', async ({ page }) => {
    await page.route(/\/search\/movies\//, interceptSearch);

    await page.goto('/');
    const searchInput = page.getByPlaceholder('Search by title, director, or country...');

    await searchInput.fill('Room');

    // "Four Rooms" should appear as a suggestion
    const suggestion = page.getByText('Four Rooms').first();
    await expect(suggestion).toBeVisible({ timeout: 5000 });
  });

  test('search endpoint should return valid JSON with hits array', async ({ request }) => {
    const resp = await request.get(`${tmdbUrl}/search/movies/test`);
    expect(resp.status()).toBe(200);
    const contentType = resp.headers()['content-type'] || '';
    expect(contentType).toContain('application/json');
    const body = await resp.json();
    expect(body).toHaveProperty('hits');
    expect(Array.isArray(body.hits)).toBe(true);
  });
});
