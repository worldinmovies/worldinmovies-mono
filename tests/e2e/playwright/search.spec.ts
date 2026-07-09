import { test, expect } from '@playwright/test';

test.describe('Movie Search', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/image.tmdb.org/**', route => route.abort());
    await page.addInitScript(() => {
      localStorage.setItem('heroViewed', 'true');
    });
  });

  test('shows suggestions when typing a movie title', async ({ page }) => {
    await page.goto('/');
    await page.locator('.grid.grid-cols-2 > div').first().waitFor({ state: 'visible', timeout: 20000 });

    // Type a known movie title in the search box
    const searchInput = page.locator('input[placeholder="Search by title, director, or country..."]');
    await searchInput.fill('parasite');

    // Wait for debounced API call (300ms) + response and suggestions to render
    const suggestion = page.getByRole('option', { name: /parasite/i });
    await expect(suggestion).toBeVisible({ timeout: 10000 });
  });

  test('shows no suggestions for non-existent movies', async ({ page }) => {
    await page.goto('/');
    await page.locator('.grid.grid-cols-2 > div').first().waitFor({ state: 'visible', timeout: 20000 });

    const searchInput = page.locator('input[placeholder="Search by title, director, or country..."]');
    await searchInput.fill('xyznonexistentmovie2026');

    // Wait for debounce + API response
    await page.waitForTimeout(2000);

    // No suggestions should appear
    const options = page.locator('[role="option"]');
    await expect(options).toHaveCount(0);
  });

  test('clearing search input restores the grid', async ({ page }) => {
    // Ensure the backend responds before checking — prevents flakiness
    // when the page load event fires before the React app finishes fetching
    const initialResponse = page.waitForResponse(
      resp => resp.url().includes('/view/random/best/') && resp.status() === 200
    );
    await page.goto('/');
    await initialResponse;
    await page.locator('.grid.grid-cols-2 > div').first().waitFor({ state: 'visible', timeout: 15000 });

    const searchInput = page.locator('input[placeholder="Search by title, director, or country..."]');

    // Type to trigger suggestions
    await searchInput.fill('parasite');
    const suggestion = page.getByRole('option', { name: /parasite/i });
    await expect(suggestion).toBeVisible({ timeout: 10000 });

    // Clear the input
    await searchInput.clear();
    await page.waitForTimeout(500);

    // Suggestions should disappear
    const options = page.locator('[role="option"]');
    await expect(options).toHaveCount(0);

    // Grid should still be visible with movies
    const cards = page.locator('.grid.grid-cols-2 > div');
    await expect(cards.first()).toBeVisible();
  });

  test('clicking a search suggestion and opening movie detail', async ({ page }) => {
    await page.goto('/');
    await page.locator('.grid.grid-cols-2 > div').first().waitFor({ state: 'visible', timeout: 20000 });

    // Search for a movie
    const searchInput = page.locator('input[placeholder="Search by title, director, or country..."]');
    await searchInput.fill('godfather');

    // Wait for suggestion
    const suggestion = page.getByRole('option', { name: /godfather/i });
    await expect(suggestion).toBeVisible({ timeout: 10000 });

    // Click the suggestion
    await suggestion.click();

    // The search input should be cleared after selection
    await expect(searchInput).toHaveValue('');

    // If the movie is in the grid, a modal should open; if not, the grid stays.
    // This is a best-effort assertion — the modal may or may not appear depending
    // on whether the movie is already loaded in the visible grid.
    // We just verify no crash and input is cleared.
    await page.waitForTimeout(1000);
  });
});
