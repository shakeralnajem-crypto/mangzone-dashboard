import { test, expect } from '@playwright/test';

test('appointments critical flow', async ({ page }) => {
  await page.goto('http://127.0.0.1:4173/login');

  await page.getByTestId('login-email').fill('admin@test.com');
  await page.getByTestId('login-password').fill('12345678');
  await page.getByTestId('login-submit').click();

  await page.waitForURL(/dashboard|appointments/);
  await page.waitForLoadState('networkidle');
  await page.goto('http://127.0.0.1:4173/appointments');
  await page.waitForLoadState('networkidle');

  // status update
  const statusTrigger = page.getByTestId(/appointment-status-/).first();
  await expect(statusTrigger).toBeVisible();

  const tagName = await statusTrigger.evaluate((el) =>
    el.tagName.toLowerCase()
  );

  if (tagName === 'select') {
    await statusTrigger.selectOption({ value: 'NO_SHOW' });
  } else {
    await statusTrigger.click();
    const visibleMenuItem = page
      .getByText(/Scheduled|Arrived|Completed|Cancelled|No Show/i)
      .locator(':visible')
      .last();
    await visibleMenuItem.click();
  }

  // edit appointment
  const editBtn = page.getByTestId(/appointment-edit-/).first();
  await expect(editBtn).toBeVisible();
  await editBtn.click();

  const saveBtn = page.getByRole('button', { name: /save|update/i });
  if (await saveBtn.count()) {
    await saveBtn.click();
  }

  // delete appointment
  const deleteBtn = page.getByTestId(/appointment-delete-/).first();
  await expect(deleteBtn).toBeVisible();
  await deleteBtn.click();

  await expect(page.getByTestId(/appointment-status-/).first()).toBeVisible();
});
