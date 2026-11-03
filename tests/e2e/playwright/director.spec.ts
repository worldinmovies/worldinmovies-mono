import { test, expect } from '@playwright/test';

test.describe('Director Filmography', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/image.tmdb.org/**', route => route.abort());
    await page.addInitScript(() => {
      localStorage.setItem('heroViewed', 'true');
    });
  });

  test('navigates to director page when clicking director name', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('.grid.grid-cols-2 > div');
    await expect(cards.first()).toBeVisible({ timeout: 60000 });

    // Click on the director name link (has cursor-pointer class)
    const firstCard = cards.first();
    const directorLink = firstCard.locator('p.cursor-pointer');
    await expect(directorLink).toBeVisible({ timeout: 10000 });

    await directorLink.click();

    // Should navigate to /director/:directorName
    await expect(page).toHaveURL(/\/director\/.+/, { timeout: 60000 });
  });

  test('director page displays director name and filmography', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('.grid.grid-cols-2 > div');
    await expect(cards.first()).toBeVisible({ timeout: 60000 });

    // Get the director name from the first card
    const firstCard = cards.first();
    const directorLink = firstCard.locator('p.cursor-pointer');
    const directorText = await directorLink.textContent();
    const directorName = directorText?.replace('Dir. ', '')?.trim();

    if (!directorName) {
      test.skip(true, 'No director name found in card');
    }

    await directorLink.click();
    await expect(page).toHaveURL(/\/director\/.+/, { timeout: 60000 });

    // Verify director name appears in the page heading
    await expect(page.locator('h1')).toContainText(directorName, { timeout: 30000 });
  });

  test('director page shows filmography badge with movie count', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('.grid.grid-cols-2 > div');
    await expect(cards.first()).toBeVisible({ timeout: 60000 });

    const firstCard = cards.first();
    const directorLink = firstCard.locator('p.cursor-pointer');
    await directorLink.click();

    await expect(page).toHaveURL(/\/director\/.+/, { timeout: 60000 });

    // Should show a badge with film count (e.g., "2 films")
    const badge = page.getByRole('status')
      .or(page.locator('span').filter({ hasText: /films?/ }));
    await expect(badge.first()).toBeVisible({ timeout: 30000 });
  });

  test('director page has back navigation', async ({ page }) => {
    await page.goto('/');

    const cards = page.locator('.grid.grid-cols-2 > div');
    await expect(cards.first()).toBeVisible({ timeout: 60000 });

    const firstCard = cards.first();
    const directorLink = firstCard.locator('p.cursor-pointer');
    await directorLink.click();

    await expect(page).toHaveURL(/\/director\/.+/, { timeout: 60000 });

    // Click back button
    const backBtn = page.getByRole('button', { name: 'Back' });
    await expect(backBtn).toBeVisible({ timeout: 10000 });
    await backBtn.click();

    // Should navigate back to home
    await expect(page).toHaveURL(/\/$/, { timeout: 30000 });
  });
});
