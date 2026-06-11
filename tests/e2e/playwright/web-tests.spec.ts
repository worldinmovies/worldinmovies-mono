import { test, expect } from '@playwright/test';

test.describe('World Map page', () => {
  test('Title should be World in Movies', async ({ page }) => {
    await page.goto('/map');
    await expect(page).toHaveTitle(/World in Movies/);
  });

  test('US country should be clickable and navigate to country page', async ({ page }) => {
    await page.goto('/map');
    await page.locator('path[data-code="US"]').click({ force: true });
    await expect(page).toHaveURL(/\/country\/US/);
  });

  test('US country page should show country name', async ({ page }) => {
    await page.goto('/map');
    await page.locator('path[data-code="US"]').click({ force: true });
    await expect(page.locator('h1')).toHaveText('United States');
  });

  test('SE country should be clickable and navigate to country page', async ({ page }) => {
    await page.goto('/map');
    await page.locator('path[data-code="SE"]').click({ force: true });
    await expect(page).toHaveURL(/\/country\/SE/);
  });

  test('SE country page should show country name', async ({ page }) => {
    await page.goto('/map');
    await page.locator('path[data-code="SE"]').click({ force: true });
    await expect(page.locator('h1')).toHaveText('Sweden');
  });
});

test.describe('Imports page', () => {
  test('Import movies page should have IMDB section', async ({ page }) => {
    await page.goto('/import');
    await expect(page.locator('h2')).toContainText('Import');
    await expect(page.locator('img[alt="IMDB"]')).toBeVisible();
  });
});
