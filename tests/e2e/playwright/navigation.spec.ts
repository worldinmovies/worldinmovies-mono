import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test('has correct title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/World in Movies/);
  });
});

test.describe('Imports page', () => {
  test('should have IMDB section', async ({ page }) => {
    await page.goto('/import');
    await expect(page.locator('h2')).toContainText('Import');
    await expect(page.locator('img[alt="IMDB"]')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('Home link in Navbar navigates to homepage', async ({ page }) => {
    await page.goto('/about');
    await page.getByRole('link', { name: /world in movies/i }).first().click();
    await expect(page).toHaveURL(/\//);
  });

  test('Import link in Navbar navigates to import page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Import' }).first().click();
    await expect(page).toHaveURL(/.*import/);
  });

  test('About link in Navbar navigates to about page', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'About' }).first().click();
    await expect(page).toHaveURL(/.*about/);
  });
});
