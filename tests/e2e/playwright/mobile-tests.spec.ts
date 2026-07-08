import { test, expect } from '@playwright/test';

test.describe('Mobile viewport (iPhone 14 Pro 390×844)', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('homepage renders with search input at mobile width', async ({ page }) => {
    await page.goto('/');

    // Search input should be visible at mobile width
    const searchInput = page.getByPlaceholder('Search by title, director, or country...');
    await expect(searchInput).toBeVisible({ timeout: 5000 });

    // Main navigation links exist (responsive)
    const navLink = page.getByRole('link', { name: /world map/i });
    await expect(navLink).toBeVisible();
  });

  test('search flow works at mobile viewport', async ({ page }) => {
    // Intercept the search API call via tmdb.localhost (relative URL)
    await page.route(/\/search\/movies\//, async (route) => {
      const url = route.request().url();
      const query = url.split('/').pop() || '';
      if (query.toLowerCase().startsWith('ariel')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            hits: [
              {
                id: 42,
                title: 'Ariel',
                original_title: 'Ariel',
                overview: 'A Finnish film',
                directors: ['Aki Kaurismäki'],
                year: '1988',
                weighted_rating: 7.8,
                guessed_country: 'FI',
                poster: '/ariel.jpg',
              },
            ],
          }),
        });
      } else {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{"hits":[]}' });
      }
    });

    await page.goto('/');
    await page.waitForTimeout(500);

    const searchInput = page.getByPlaceholder('Search by title, director, or country...');
    await searchInput.fill('Ariel');
    await expect(page.getByText('Ariel')).toBeVisible({ timeout: 3000 });
    await expect(page.getByText('1988')).toBeVisible();
  });

  test('country filter dropdown is tappable at mobile width', async ({ page }) => {
    // Intercept random/best endpoint
    await page.route(/\/view\/random\/best/, async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            _id: 100,
            original_title: 'Mobile Movie',
            year: 2020,
            estimated_country: 'FI',
            director: 'Test Director',
            imdb_vote_average: 0,
            vote_average: 7.0,
            rating: 7.0,
            genres: ['Drama'],
            poster_path: '/test.jpg',
            overview: 'Test movie for mobile viewport',
          },
        ]),
      });
    });

    await page.goto('/');
    await page.waitForTimeout(1000);

    // The country filter Select trigger should be visible
    const countryTrigger = page.locator('button').filter({ hasText: /all countries|explore by country/i }).first();
    await expect(countryTrigger).toBeVisible({ timeout: 5000 });

    // The genre filter button should be visible
    const genreButton = page.getByText('All Genres');
    await expect(genreButton).toBeVisible();
  });

  test('movie grid renders cards at mobile width', async ({ page }) => {
    await page.route(/\/view\/random\/best/, async (route) => {
      const movies = Array.from({ length: 8 }, (_, i) => ({
        _id: 200 + i,
        original_title: `Mobile Movie ${i + 1}`,
        year: 2020 + i,
        estimated_country: i % 2 === 0 ? 'FI' : 'SE',
        director: `Director ${i}`,
        imdb_vote_average: 0,
        vote_average: 6.0 + i * 0.3,
        rating: 6.0 + i * 0.3,
        genres: ['Drama'],
        poster_path: `/mob${i}.jpg`,
        overview: `Mobile movie ${i + 1}`,
      }));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(movies),
      });
    });

    await page.goto('/');
    await page.waitForTimeout(1500);

    // Movie cards should be visible
    const cards = page.locator('img[alt*="Mobile Movie"]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(4);

    // No horizontal overflow (page scrolls vertically only)
    const htmlWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(htmlWidth).toBeLessThanOrEqual(viewportWidth + 1); // allow 1px for rounding
  });
});
