import { test as setup } from '@playwright/test';
import { login } from './helpers/auth';

/**
 * Runs once before all feature tests (configured as a "setup" project dependency).
 * Saves the authenticated browser state (cookies + localStorage) to a file so
 * subsequent tests can skip the login round-trip entirely.
 */
const AUTH_FILE = 'playwright/.auth/user.json';

setup('authenticate', async ({ page }) => {
  await login(page);
  await page.context().storageState({ path: AUTH_FILE });
});
