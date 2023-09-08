import { test, expect } from '@playwright/test';

test.describe('My Validation Test Suite',() => {

  test.beforeEach(async ({ page }) => {
    console.log("Starting a new test ..")
  });

  test('has title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Contoso Real Estate/);
  });

  test('get started link', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Browse listings' }).click();
    await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
  });

  test.afterAll(async () => {
    console.log('Finished all sets in this suite');
  });

});