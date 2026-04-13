import { test, expect } from '@playwright/test';
import { login } from './helpers/auth';

/**
 * Auth tests — run WITHOUT storageState ("auth" project in playwright.config.ts).
 * These test the real login UI, not the authenticated shell.
 */

test.describe('Authentication', () => {
  test('redirects to /dashboard after successful login', async ({ page }) => {
    await login(page);
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('renders sidebar and topbar after login', async ({ page }) => {
    await login(page);
    // Sidebar is visible at 1280 px viewport (hidden lg:flex in AppLayout).
    await expect(page.locator('aside')).toBeVisible();
    // Logo alt is always "MANGZONE" regardless of UI language.
    await expect(page.locator('aside img[alt="MANGZONE"]')).toBeVisible();
    await expect(page.locator('header')).toBeVisible();
  });

  test('shows error message for wrong credentials', async ({ page }) => {
    await page.goto('/');
    await page.locator('input[type="email"]').fill('wrong@test.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button[type="submit"]').click();

    // The login page renders an error div with Tailwind class bg-red-50.
    // Waiting for it to be visible is a deterministic signal that the auth
    // request completed and was rejected — no arbitrary timeout needed.
    await expect(page.locator('[class*="bg-red-50"]')).toBeVisible();
    expect(page.url()).not.toMatch(/\/dashboard/);
  });
});
