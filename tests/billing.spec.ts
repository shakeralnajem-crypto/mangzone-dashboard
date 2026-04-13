import { test, expect } from '@playwright/test';

/**
 * Billing page tests — storageState provides auth.
 *
 * DOM facts (BillingPage.tsx):
 *  - Toolbar:       .ds-card nth(0)  — only .ds-card before stat cards
 *                   Stat cards use .ds-stat (not .ds-card), so .ds-card.first() = toolbar ✓
 *  - Add button:    .ds-btn-primary inside the toolbar (Export uses .ds-btn-ghost)
 *  - Stat cards:    .ds-stat (4 cards, always rendered)
 *  - Table rows:    .ds-tbody-row (only when invoices exist)
 *  - Edit button:   .ds-icon-btn — only action button per row (no delete on billing)
 *  - Modal:         .ds-overlay > .ds-modal
 *  - Modal header:  .ds-modal-hd
 *  - Modal cancel:  .ds-btn-ghost inside .ds-modal
 *
 * Selectors are language-independent: class-based, no EN/AR text assertions.
 */

test.describe('Billing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/billing');
    // Wait for the toolbar — confirms React mounted, auth passed, page is interactive.
    await expect(page.locator('.ds-card').first()).toBeVisible();
  });

  // ── Page shell ──────────────────────────────────────────────────────────────

  test('renders toolbar with primary action button', async ({ page }) => {
    const toolbar = page.locator('.ds-card').first();
    // The only .ds-btn-primary in the toolbar is the add invoice button.
    await expect(toolbar.locator('.ds-btn-primary')).toBeVisible();
  });

  test('renders four stat cards', async ({ page }) => {
    await expect(page.locator('.ds-stat')).toHaveCount(4);
  });

  // ── Add Invoice modal ───────────────────────────────────────────────────────

  test('opens Add Invoice modal with a pre-filled invoice number', async ({ page }) => {
    await page.locator('.ds-card').first().locator('.ds-btn-primary').click();

    const modal = page.locator('.ds-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.ds-modal-hd')).toBeVisible();

    // First <input> in the modal is the invoice_number field, auto-filled with INV-XXX.
    // .first() is required: multiple inputs follow it in the form.
    const invoiceInput = modal.locator('input').first();
    await expect(invoiceInput).toBeVisible();
    await expect(invoiceInput).not.toBeEmpty();
  });

  test('dismisses Add Invoice modal via Cancel', async ({ page }) => {
    await page.locator('.ds-card').first().locator('.ds-btn-primary').click();

    const modal = page.locator('.ds-modal');
    await expect(modal).toBeVisible();

    // .ds-btn-ghost inside the modal is always the Cancel button.
    await modal.locator('.ds-btn-ghost').click();
    await expect(modal).not.toBeVisible();
  });

  // ── Edit Invoice modal ──────────────────────────────────────────────────────

  test('opens Edit Invoice modal pre-filled when a row exists', async ({ page }) => {
    const rows = page.locator('.ds-tbody-row');
    if (await rows.count() === 0) {
      test.skip(true, 'No invoice rows — skipping edit modal test');
      return;
    }

    // Each billing row has exactly one .ds-icon-btn (edit). No delete button exists.
    // .first() on rows: topmost invoice in the list.
    await rows.first().locator('.ds-icon-btn').click();

    const modal = page.locator('.ds-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.ds-modal-hd')).toBeVisible();

    // invoice_number input (first in modal) must be pre-filled.
    await expect(modal.locator('input').first()).not.toBeEmpty();
  });
});
