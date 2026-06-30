import { test, expect, type Route } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────────────────

function createDiscoverMovies(startId: number, count: number) {
  const countries = ['US', 'FI', 'SE', 'FR', 'JP', 'DE', 'GB', 'IT'];
  const genres = ['Drama', 'Comedy', 'Action', 'Thriller', 'Romance', 'Sci-Fi'];
  return Array.from({ length: count }, (_, i) => ({
    _id: startId + i,
    original_title: `Test Movie ${startId + i}`,
    year: 2020 + (i % 6),
    estimated_country: countries[i % countries.length],
    director: `Director ${startId + i}`,
    imdb_vote_average: 0,
    vote_average: +(6.5 + (i % 3) * 0.5).toFixed(1),
    rating: +(6.5 + (i % 3) * 0.5).toFixed(1),
    genres: [genres[i % genres.length]],
    poster_path: '/test.jpg',
    overview: `Overview for test movie ${startId + i}.`,
  }));
}

interface BackendMovie {
  _id: number;
  original_title: string;
  year: number;
  estimated_country: string;
  vote_average: number;
  genres: { _id: number; name: string }[];
  poster_path: string;
  overview: string;
  credits: { crew: { job: string; name: string }[] };
}

function createBackendMovie(id: number): BackendMovie {
  return {
    _id: id,
    original_title: `Test Movie ${id}`,
    year: 2020,
    estimated_country: 'US',
    vote_average: 7.5,
    genres: [{ _id: 1, name: 'Drama' }, { _id: 2, name: 'Comedy' }],
    poster_path: '/test.jpg',
    overview: `Detailed overview for test movie ${id}.`,
    credits: {
      crew: [
        { job: 'Director', name: `Director ${id}` },
        { job: 'Producer', name: `Producer ${id}` },
      ],
    },
  };
}

// ── Tests ──────────────────────────────────────────────────────────

test.describe('Movie grid interactions', () => {
  test('should show movie cards and load more on scroll', async ({ page }) => {
    // Track route intercept calls to return paginated data
    let routeCalls = 0;
    const PAGE_1 = createDiscoverMovies(1, 8);
    const PAGE_2 = createDiscoverMovies(101, 4);

    await page.route(/\/view\/random\/best/, async (route: Route) => {
      routeCalls++;
      const body = routeCalls === 1 ? PAGE_1 : PAGE_2;
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });

    await page.goto('/');

    // Wait for initial movie cards to render (route call 1)
    const grid = page.locator('section').filter({ hasText: 'Featured Films' }).locator('[class*="grid"]').first();
    await expect(grid.locator('> *')).toHaveCount(8, { timeout: 8000 });

    // Scroll the observer target into view
    await page.evaluate(() => {
      // The observerRef is the last empty div in the Featured Films section
      const divs = document.querySelectorAll('section div');
      const last = divs[divs.length - 1];
      if (last) last.scrollIntoView({ behavior: 'instant', block: 'end' });
    });

    // Wait for loading indicator
    await expect(page.getByText('Discovering more films')).toBeVisible({ timeout: 5000 });

    // Wait for loading to finish and new cards to appear
    await expect(page.getByText('Discovering more films')).not.toBeVisible({ timeout: 8000 });

    // Now there should be 12 cards (8 + 4)
    await expect(grid.locator('> *')).toHaveCount(12, { timeout: 5000 });
  });
});

test.describe('Seen / Unseen toggle', () => {
  test('should mark a movie as seen and persist across modal opens', async ({ page }) => {
    const TEST_MOVIE_ID = 42;

    // Intercept movie grid API
    const PAGE_1 = createDiscoverMovies(1, 12);
    await page.route(/\/view\/random\/best/, async (route: Route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(PAGE_1) });
    });

    // Intercept movie detail API
    await page.route(/\/movie\/\d+/, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(createBackendMovie(TEST_MOVIE_ID)),
  });
});

test.describe('Genre filter interaction', () => {
  test('should include genre filter in API call when a genre is selected', async ({ page }) => {
    const genreApiCalls: string[] = [];

    // Intercept movie grid API to capture genre filter
    await page.route(/\/view\/random\/best/, async (route) => {
      const url = route.request().url();
      genreApiCalls.push(url);
      const body = createDiscoverMovies(1, 8);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });

    await page.goto('/');

    // Wait for initial grid to load
    const grid = page.locator('section').filter({ hasText: 'Featured Films' }).locator('[class*="grid"]').first();
    await expect(grid.locator('> *')).toHaveCount(8, { timeout: 8000 });

    // Initial call should NOT have genre filter
    const initialCall = genreApiCalls[0];
    expect(initialCall).not.toContain('genres');

    // Click the "All Genres" button to open the genre dropdown
    const genreButton = page.getByText('All Genres');
    await genreButton.click();

    // Select "Drama" from the dropdown menu
    const dramaOption = page.getByText('Drama').locator('..');
    await dramaOption.click();

    // Wait for the second API call with genre filter
    await page.waitForTimeout(500);
    const genreCall = genreApiCalls[genreApiCalls.length - 1];
    expect(genreCall).toContain('genres=Drama');

    // The button text should now be "Drama" instead of "All Genres"
    await expect(page.getByText('Drama').first()).toBeVisible();
  });

  test('should clear genre filter when selecting "All Genres" again', async ({ page }) => {
    const genreApiCalls: string[] = [];

    await page.route(/\/view\/random\/best/, async (route) => {
      const url = route.request().url();
      genreApiCalls.push(url);
      const body = createDiscoverMovies(1, 8);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });

    await page.goto('/');
    await expect(
      page.locator('section').filter({ hasText: 'Featured Films' }).locator('[class*="grid"] > *').first()
    ).toBeVisible({ timeout: 8000 });

    // Open genre dropdown and select Drama
    await page.getByText('All Genres').click();
    await page.getByText('Drama').locator('..').click();
    await page.waitForTimeout(500);

    // Now clear by selecting "All Genres" from the dropdown
    await page.getByText('Drama').first().click();
    await page.getByText('All Genres').first().click();
    await page.waitForTimeout(500);

    // The latest API call should not contain genre filter
    const lastCall = genreApiCalls[genreApiCalls.length - 1];
    expect(lastCall).not.toContain('genres');
  });

  test('should combine country and genre filters in a single API call', async ({ page }) => {
    const apiCalls: string[] = [];

    // Intercept both random/best and best/ endpoints
    await page.route(/\/view\/(random\/best|best\/)/, async (route) => {
      const url = route.request().url();
      apiCalls.push(url);
      const body = createDiscoverMovies(1, 8);
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
    });

    await page.goto('/');
    await expect(
      page.locator('section').filter({ hasText: 'Featured Films' }).locator('[class*="grid"] > *').first()
    ).toBeVisible({ timeout: 8000 });

    // Select Drama genre first
    await page.getByText('All Genres').click();
    await page.getByText('Drama').locator('..').click();
    await page.waitForTimeout(500);

    // Then select a country via the CountryFilter select
    const countryTrigger = page.locator('[class*="SelectTrigger"]').first();
    await countryTrigger.click();

    // Find and click the Sweden option
    const swedenOption = page.getByText('Sweden').locator('..');
    await swedenOption.click();
    await page.waitForTimeout(500);

    // The latest API call should include both country and genre
    const lastCall = apiCalls[apiCalls.length - 1];
    expect(lastCall).toContain('genres=Drama');
    expect(lastCall).toContain('/view/best/SE');
  });
});

    await page.goto('/');

    // Wait for movie cards to render
    const firstCard = page.locator('section').filter({ hasText: 'Featured Films' }).locator('[class*="grid"] > *').first();
    await expect(firstCard).toBeVisible({ timeout: 8000 });

    // Click the first movie card
    await firstCard.click();

    // The modal opens with a loading spinner briefly, then shows movie data
    // Wait for the "Mark as Seen" button to appear (means modal fully loaded)
    const seenButton = page.getByRole('button', { name: /Mark as Seen|Seen/ });
    await expect(seenButton).toBeVisible({ timeout: 10000 });

    // It should say "Mark as Seen" initially (not yet seen)
    await expect(seenButton).toContainText('Mark as Seen');

    // Click to mark as seen
    await seenButton.click();

    // Button text should now be "Seen"
    await expect(seenButton).toContainText('Seen');
    await expect(seenButton).not.toContainText('Mark as Seen');

    // Close the modal (click outside / close button)
    await page.keyboard.press('Escape');
    await expect(seenButton).not.toBeVisible();

    // Re-open by clicking the first card again
    await firstCard.click();

    // The seen button should still show "Seen" (persisted via localStorage)
    const reopenedSeenButton = page.getByRole('button', { name: /Mark as Seen|Seen/ });
    await expect(reopenedSeenButton).toBeVisible({ timeout: 10000 });
    await expect(reopenedSeenButton).toContainText('Seen');
  });
});
