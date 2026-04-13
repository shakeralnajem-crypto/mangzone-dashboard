import { defineConfig, devices } from '@playwright/test';

/**
 * Auth state is saved once in global.setup.ts and reused across all main-project tests.
 * Auth-specific tests run without storageState so they can test the login flow itself.
 */
const AUTH_FILE = 'playwright/.auth/user.json';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',

  use: {
    baseURL: 'https://mangzone.netlify.app',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    /* Desktop viewport — sidebar is visible at 1280 px (hidden lg:flex) */
    viewport: { width: 1280, height: 800 },
  },

  projects: [
    // ── 1. Global setup: login once, save auth cookie/localStorage ──────────────
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },

    // ── 2. Auth tests — run WITHOUT storageState so they can test the login UI ──
    {
      name: 'auth',
      testMatch: /auth\.spec\.ts/,
      use: { ...devices['Desktop Chrome'] },
    },

    // ── 3. Feature tests — reuse saved auth state (no re-login overhead) ────────
    {
      name: 'chromium',
      testIgnore: /auth\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
      dependencies: ['setup'],
    },
  ],
});
