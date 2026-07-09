import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('desktop navbar shows all navigation links', async ({ page }) => {
    await page.goto('/');

    await expect(page.getByRole('link', { name: 'Home' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Watchlist' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Import' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
  });

  test('navigates to Import page via nav link', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Import' }).click();
    await expect(page.locator('h1')).toHaveText('Import Your Movies');
    await expect(page.getByRole('heading', { name: 'Import from IMDb' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Import from Letterboxd' })).toBeVisible();
  });

  test('navigates to Watchlist page via nav link', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Watchlist' }).click();
    await expect(page.locator('h1')).toHaveText('My Watchlist');
    await expect(page.getByText('Your watchlist is empty')).toBeVisible();
  });

  test('shows 404 page for unknown routes with working home link', async ({ page }) => {
    await page.goto('/nonexistent-route');
    await expect(page.locator('h1')).toHaveText('404');
    await expect(page.getByText('Oops! Page not found')).toBeVisible();

    await page.getByRole('link', { name: 'Return to Home' }).click();
    await expect(page).toHaveURL('/');
  });

  test('mobile hamburger menu works on small viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    await expect(hamburger).toBeVisible();

    await hamburger.click();
    await page.getByRole('link', { name: 'Import' }).click();
    await expect(page.locator('h1')).toHaveText('Import Your Movies');
  });
});
