import { type Page } from '@playwright/test';

const EMAIL = 'admin@test.com';
const PASSWORD = '12345678';

/**
 * Perform a full login flow and wait for the dashboard redirect.
 * Used by global.setup.ts and auth.spec.ts.
 */
export async function login(page: Page): Promise<void> {
  await page.goto('/');
  await page.locator('input[type="email"]').fill(EMAIL);
  await page.locator('input[type="password"]').fill(PASSWORD);
  await page.locator('button[type="submit"]').click();
  // The app always redirects to /dashboard on successful login.
  await page.waitForURL('**/dashboard', { timeout: 20_000 });
}

/**
 * Navigate to a section by clicking the sidebar anchor.
 * Only call this when the app shell is already rendered (e.g. after page.goto('/dashboard')).
 * Uses href-based selectors — language-independent.
 */
export async function gotoSection(page: Page, href: string): Promise<void> {
  await page.locator(`a[href="${href}"]`).click();
  await page.waitForURL(`**${href}`);
}
