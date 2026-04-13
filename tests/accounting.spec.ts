import { test, expect } from '@playwright/test';

/**
 * Accounting page tests — storageState provides auth.
 *
 * DOM facts (AccountingPage.tsx):
 *  - Tab bar:       .ds-tabs > .ds-tab buttons (3 tabs in order: Expenses, Doctor Dues, Monthly Report)
 *  - Add button:    .ds-btn-primary in a flex row — NOT inside any .ds-card (ExpensesTab only)
 *  - Inline form:   <form> element rendered when showForm=true; has .ds-btn-primary (Save) + .ds-btn-ghost (Cancel)
 *  - Table rows:    .ds-tbody-row inside expenses content area
 *  - Edit button:   .ds-icon-btn per row — distinct class from delete (.ds-icon-btn-err)
 *  - Delete button: .ds-icon-btn-err per row
 *  - Edit modal:    .ds-overlay > .ds-modal (NOT role="dialog")
 *  - Modal header:  .ds-modal-hd
 *
 * Selectors are language-independent: .ds-tab nth() for tabs, .ds-btn-primary/.ds-btn-ghost
 * for buttons. No EN/AR text used as selectors.
 */

test.describe('Accounting', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/accounting');
    // Wait for tab strip — confirms page mounted. Expenses tab is active by default.
    await expect(page.locator('.ds-tabs')).toBeVisible();
  });

  // ── Tab strip ─────────────────────────────────────────────────────────────

  test('renders three tabs', async ({ page }) => {
    // Exactly 3 tab buttons: Expenses (0), Doctor Dues (1), Monthly Report (2).
    await expect(page.locator('.ds-tab')).toHaveCount(3);
  });

  test('Expenses tab is active by default', async ({ page }) => {
    // The active tab has class "ds-tab active".
    await expect(page.locator('.ds-tab.active')).toHaveCount(1);
    // And it is the first tab.
    await expect(page.locator('.ds-tab').nth(0)).toHaveClass(/active/);
  });

  test('switches to Doctor Dues tab (2nd)', async ({ page }) => {
    await page.locator('.ds-tab').nth(1).click();
    // After switching, the Add Expense button (inside <main>) disappears.
    // Scoped to <main> to exclude the topbar's "New Appointment" .ds-btn-primary.
    await expect(page.locator('main .ds-btn-primary')).not.toBeVisible();
    // The second tab is now active.
    await expect(page.locator('.ds-tab').nth(1)).toHaveClass(/active/);
  });

  test('switches to Monthly Report tab (3rd)', async ({ page }) => {
    await page.locator('.ds-tab').nth(2).click();
    await expect(page.locator('main .ds-btn-primary')).not.toBeVisible();
    await expect(page.locator('.ds-tab').nth(2)).toHaveClass(/active/);
  });

  // ── Add Expense inline form ───────────────────────────────────────────────

  test('Add button is visible on Expenses tab', async ({ page }) => {
    // Scoped to <main> to exclude the always-present topbar "New Appointment" button.
    await expect(page.locator('main .ds-btn-primary')).toBeVisible();
  });

  test('clicking Add button reveals the inline form', async ({ page }) => {
    await page.locator('main .ds-btn-primary').click();
    // The inline form element appears with its own Submit button inside <form>.
    // Scoping to <form> isolates the Save button from the Add button (outside <form>).
    await expect(page.locator('form .ds-btn-primary')).toBeVisible();
  });

  test('inline form is dismissed via Cancel', async ({ page }) => {
    await page.locator('main .ds-btn-primary').click();
    await expect(page.locator('form .ds-btn-ghost')).toBeVisible();
    await page.locator('form .ds-btn-ghost').click();
    // After cancel the <form> element is unmounted.
    await expect(page.locator('form')).not.toBeVisible();
  });

  // ── Edit Expense modal ────────────────────────────────────────────────────

  test('each expense row has an edit button and a delete button', async ({ page }) => {
    const rows = page.locator('.ds-tbody-row');
    if (await rows.count() === 0) {
      test.skip(true, 'No expense rows — skipping');
      return;
    }
    const row = rows.first();
    // .ds-icon-btn = edit; .ds-icon-btn-err = delete. Different classes, one each per row.
    await expect(row.locator('.ds-icon-btn')).toBeVisible();
    await expect(row.locator('.ds-icon-btn-err')).toBeVisible();
  });

  test('opens Edit Expense modal pre-filled', async ({ page }) => {
    const rows = page.locator('.ds-tbody-row');
    if (await rows.count() === 0) {
      test.skip(true, 'No expense rows — skipping edit modal test');
      return;
    }

    // Click edit (.ds-icon-btn), NOT delete (.ds-icon-btn-err), in the first row.
    // No .first() needed — exactly one .ds-icon-btn per row.
    await rows.first().locator('.ds-icon-btn').click();

    const modal = page.locator('.ds-modal');
    await expect(modal).toBeVisible();
    await expect(modal.locator('.ds-modal-hd')).toBeVisible();

    // Amount input (type="number") is pre-filled — not empty.
    // No .first() needed — only one number input in ExpenseEditModal.
    await expect(modal.locator('input[type="number"]')).not.toBeEmpty();
  });

  test('delete button is present per row (presence check — no mutation)', async ({ page }) => {
    const rows = page.locator('.ds-tbody-row');
    if (await rows.count() === 0) {
      test.skip(true, 'No expense rows — skipping');
      return;
    }
    // Presence check only — do NOT click (would open confirm() and mutate data).
    await expect(rows.first().locator('.ds-icon-btn-err')).toBeVisible();
  });
});
