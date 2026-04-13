import { test, expect } from '@playwright/test';

/**
 * Follow-up page tests — storageState provides auth.
 *
 * DOM facts (FollowupPage.tsx):
 *  - Toolbar:      .ds-card nth(0) — Export CSV + Auto-Generate buttons
 *  - Tab strip:    .ds-tabs inside .ds-card nth(1), 4 tabs in order:
 *                  All (0), Pending (1), Overdue (2), Done (3)
 *  - Tab buttons:  .ds-tab class — each contains label text + count <span> child
 *                  (count child makes exact-text matching unreliable — use nth())
 *  - Table rows:   .ds-tbody-row (only when filtered results exist)
 *  - Edit button:  .ds-icon-btn — only action button per row with this class
 *                  WhatsApp button has no .ds-icon-btn class
 *  - Modal:        .ds-overlay > .ds-modal
 *  - Modal header: .ds-modal-hd
 *  - Modal cancel: .ds-btn-ghost inside .ds-modal
 *
 * Selectors are language-independent: .ds-tab nth() for tabs, class-based for buttons.
 */

test.describe('Follow-up', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/followup');
    // Wait for tab strip — confirms page mounted.
    await expect(page.locator('.ds-tabs')).toBeVisible();
  });

  // ── Tab strip ─────────────────────────────────────────────────────────────

  test('renders four tabs', async ({ page }) => {
    // Exactly 4 tab buttons: All (0), Pending (1), Overdue (2), Done (3).
    await expect(page.locator('.ds-tab')).toHaveCount(4);
  });

  test('All tab is active by default', async ({ page }) => {
    await expect(page.locator('.ds-tab.active')).toHaveCount(1);
    await expect(page.locator('.ds-tab').nth(0)).toHaveClass(/active/);
  });

  test('switches to Pending tab (2nd)', async ({ page }) => {
    await page.locator('.ds-tab').nth(1).click();
    await expect(page.locator('.ds-tab').nth(1)).toHaveClass(/active/);
    // Tab strip remains visible — URL does not change on tab switch.
    await expect(page.locator('.ds-tabs')).toBeVisible();
  });

  test('switches to Overdue tab (3rd)', async ({ page }) => {
    await page.locator('.ds-tab').nth(2).click();
    await expect(page.locator('.ds-tab').nth(2)).toHaveClass(/active/);
  });

  test('switches to Done tab (4th)', async ({ page }) => {
    await page.locator('.ds-tab').nth(3).click();
    await expect(page.locator('.ds-tab').nth(3)).toHaveClass(/active/);
  });

  // ── Edit Follow-up modal ──────────────────────────────────────────────────

  test('each follow-up row has an edit button', async ({ page }) => {
    const rows = page.locator('.ds-tbody-row');
    if (await rows.count() === 0) {
      test.skip(true, 'No follow-up rows — skipping');
      return;
    }
    // .ds-icon-btn = edit. WhatsApp button has no .ds-icon-btn class.
    // No .first() needed — exactly one .ds-icon-btn per row.
    await expect(rows.first().locator('.ds-icon-btn')).toBeVisible();
  });

  test('opens Edit Follow-up modal pre-filled', async ({ page }) => {
    const rows = page.locator('.ds-tbody-row');
    if (await rows.count() === 0) {
      test.skip(true, 'No follow-up rows — skipping edit modal test');
      return;
    }

    // .first() on rows: topmost follow-up. No .first() on .ds-icon-btn (unique per row).
    await rows.first().locator('.ds-icon-btn').click();

    const modal = page.locator('.ds-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.ds-modal-hd')).toBeVisible();

    // Name field is the first <input> in EditFollowupModal (no type attr = defaults to text).
    // .first() required — phone, service_interest, date inputs follow it.
    await expect(modal.locator('input').first()).not.toBeEmpty();
  });

  test('dismisses Edit Follow-up modal via Cancel', async ({ page }) => {
    const rows = page.locator('.ds-tbody-row');
    if (await rows.count() === 0) {
      test.skip(true, 'No follow-up rows — skipping modal dismiss test');
      return;
    }

    await rows.first().locator('.ds-icon-btn').click();

    const modal = page.locator('.ds-modal');
    await expect(modal).toBeVisible();

    // .ds-btn-ghost inside the modal is always the Cancel button.
    await modal.locator('.ds-btn-ghost').click();
    await expect(modal).not.toBeVisible();
  });
});
