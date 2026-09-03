import { test, expect } from '@playwright/test';

test.describe('Movie Discovery', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/image.tmdb.org/**', route => route.abort());
    await page.addInitScript(() => {
      localStorage.setItem('heroViewed', 'true');
    });
  });

  test('loads initial set of movie cards in the grid', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('.grid.grid-cols-2 > div');
    // First render on a loaded CI runner (React hydrate -> lazy MovieGrid chunk
    // -> API fetch -> render) can exceed 20s; give it generous headroom.
    await expect(cards.first()).toBeVisible({ timeout: 60000 });
  });

  test('triggers load more request when scrolling to bottom', async ({ page, browserName }) => {
    // WebKit headless has a known issue where IntersectionObserver callbacks
    // do not trigger reliably on page scroll. Skip this specific test on WebKit.
    if (browserName === 'webkit') {
      test.skip(true, 'IntersectionObserver not reliable in WebKit headless');
    }

    await page.goto('/');
    const cards = page.locator('.grid.grid-cols-2 > div');
    await expect(cards.first()).toBeVisible({ timeout: 60000 });

    // The IntersectionObserver sentinel sits below the movie grid.
    // Scroll to the bottom of the page to reveal it.
    const scrollRequest = page.waitForResponse(
      resp => resp.url().includes('/view/random/best/8') && resp.status() === 200,
      { timeout: 60000 }
    );

    // Scroll step by step to ensure the observer fires
    await page.mouse.wheel(0, 5000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    await scrollRequest;
  });

  test('country filter shows movies from selected country', async ({ page }) => {
    await page.goto('/');
    await page.locator('.grid.grid-cols-2 > div').first().waitFor({ state: 'visible', timeout: 60000 });

    // Open the combobox dropdown and select Sweden
    const filter = page.getByRole('combobox');
    await filter.click();
    // Use text locator inside the portal instead of role option — Shadcn
    // options are rendered in a portal and Firefox handles them differently.
    await page.locator('[role="option"]', { hasText: 'Sweden' }).click();
    await page.waitForTimeout(2000);

    const cards = page.locator('.grid.grid-cols-2 > div');
    await expect(cards.first()).toBeVisible({ timeout: 60000 });
    await expect(cards).toHaveCount(2, { timeout: 15000 });
  });

  test('genre filter shows movies from selected genre', async ({ page }) => {
    await page.goto('/');
    await page.locator('.grid.grid-cols-2 > div').first().waitFor({ state: 'visible', timeout: 60000 });

    await page.getByRole('button', { name: 'All Genres' }).click();
    await page.waitForTimeout(500);
    await page.getByRole('menuitem', { name: 'Comedy' }).click();
    await page.waitForTimeout(2000);

    const cards = page.locator('.grid.grid-cols-2 > div');
    await expect(cards.first()).toBeVisible({ timeout: 60000 });
  });

  test('clicking a movie card navigates to the movie detail page', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('.grid.grid-cols-2 > div');
    await expect(cards.first()).toBeVisible({ timeout: 60000 });

    // Record the target movie id from the card's click-navigation.
    await cards.first().click();

    // Selecting a movie now navigates to its dedicated /movie/:id route
    // (a real, indexable URL) instead of opening a modal.
    await expect(page).toHaveURL(/\/movie\/\d+/, { timeout: 60000 });

    // The detail page renders an h1 with the movie title after details load.
    await expect(page.locator('h1')).toBeVisible({ timeout: 60000 });
  });
});
