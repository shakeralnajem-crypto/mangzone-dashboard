import { test, expect } from '@playwright/test';
import { gotoSection } from './helpers/auth';

/**
 * Dashboard tests — storageState provides auth (no re-login).
 *
 * DOM facts (DashboardPage.tsx):
 *  - KPI cards:           .ds-stat  (NOT wrapped in .ds-card — stand-alone grid items)
 *  - Today's Schedule:    .ds-card nth(0)  → has .ds-card-hd + (.ds-spinner | .ds-empty | rows)
 *  - Quick Actions:       .ds-card nth(1)  → has .ds-card-hd + grid of nav buttons
 *  - Sidebar nav links:   <a href="/path"> — language-independent
 */

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
    // Wait until at least one KPI card is rendered — confirms React mounted and
    // the authenticated shell is fully visible.
    await expect(page.locator('.ds-stat').first()).toBeVisible();
  });

  // ── KPI stat cards ────────────────────────────────────────────────────────

  test('renders six KPI stat cards', async ({ page }) => {
    // Dashboard always renders exactly 6 KPI cards regardless of data state.
    await expect(page.locator('.ds-stat')).toHaveCount(6);
  });

  // ── Content cards ─────────────────────────────────────────────────────────

  test("renders Today's Schedule card", async ({ page }) => {
    // .ds-card nth(0) is always Today's Schedule — stat cards do not use .ds-card.
    const scheduleCard = page.locator('.ds-card').nth(0);
    await expect(scheduleCard).toBeVisible();
    // The card header is always rendered regardless of appointment data.
    await expect(scheduleCard.locator('.ds-card-hd')).toBeVisible();
  });

  test('renders Quick Actions card', async ({ page }) => {
    // .ds-card nth(1) is always Quick Actions.
    const qaCard = page.locator('.ds-card').nth(1);
    await expect(qaCard).toBeVisible();
    await expect(qaCard.locator('.ds-card-hd')).toBeVisible();
    // Quick Actions renders a grid of navigation buttons — at least one must exist.
    await expect(qaCard.locator('button').first()).toBeVisible();
  });

  // ── Sidebar navigation ────────────────────────────────────────────────────
  // These tests depend on the app shell being rendered (sidebar visible at 1280 px).

  test('navigates to Appointments via sidebar', async ({ page }) => {
    await gotoSection(page, '/appointments');
    await expect(page).toHaveURL(/\/appointments/);
  });

  test('navigates to Patients via sidebar', async ({ page }) => {
    await gotoSection(page, '/patients');
    await expect(page).toHaveURL(/\/patients/);
  });
});
