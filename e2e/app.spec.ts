import { expect, test, type Page } from '@playwright/test';

/** Title of the page currently on screen (Ionic keeps hidden pages of other tabs in the DOM). */
function visibleTitle(page: Page) {
  return page.locator('.ion-page:not(.ion-page-hidden) ion-title').last();
}

test('opens on the services tab', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveURL(/\/tabs\/services$/);
  await expect(visibleTitle(page)).toHaveText('Services');
});

test('goes from a service to its traces, a trace and a span', async ({ page }) => {
  await page.goto('/');

  await page.getByText('checkout', { exact: true }).click();
  await expect(page).toHaveURL(/\/tabs\/services\/checkout$/);
  await expect(page.getByText('Slowest operations (p99)')).toBeVisible();

  await page.getByRole('link', { name: 'View traces' }).click();
  await expect(page).toHaveURL(/\/tabs\/traces\?service=checkout$/);

  const firstTrace = page.locator('ion-item[href^="/tabs/traces/"]').first();
  await expect(firstTrace).toContainText('checkout');
  await firstTrace.click();
  await expect(page).toHaveURL(/\/tabs\/traces\/[^/?]+$/);

  await page.locator('a.row').first().click();
  await expect(page).toHaveURL(/\/tabs\/traces\/[^/]+\/spans\/[^/]+$/);
  await expect(page.getByText('Attributes', { exact: true })).toBeVisible();
});

test('reaches every tab from the tab bar', async ({ page }) => {
  await page.goto('/');

  for (const tab of ['Traces', 'Alerts', 'Settings', 'Services']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page).toHaveURL(new RegExp(`/tabs/${tab.toLowerCase()}$`));
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
  }
});

test('opens the alert history and the rule editor', async ({ page }) => {
  await page.goto('/tabs/alerts');

  await page.getByRole('link', { name: 'History' }).click();
  await expect(page).toHaveURL(/\/tabs\/alerts\/history$/);

  await page.goto('/tabs/alerts');
  await page.getByRole('link', { name: 'New' }).click();
  await expect(page).toHaveURL(/\/tabs\/alerts\/new$/);
  await expect(page.getByText('New rule')).toBeVisible();
});

test('shows validation errors on an empty rule', async ({ page }) => {
  await page.goto('/tabs/alerts/new');

  await page.locator('ion-button', { hasText: 'Save' }).click();

  await expect(page.getByText('Name is required.')).toBeVisible();
  await expect(page.getByText('Pick a service.')).toBeVisible();
  await expect(page).toHaveURL(/\/tabs\/alerts\/new$/);
});

test('fires the payment rule and records it in the history', async ({ page }) => {
  await page.goto('/tabs/alerts');

  const paymentRule = page.locator('ion-item', { hasText: 'Payment error rate' });
  await expect(paymentRule).toContainText('FIRING');

  await page.getByRole('link', { name: 'History' }).click();
  await expect(page).toHaveURL(/\/tabs\/alerts\/history$/);
  await expect(page.locator('app-alert-history ion-item', { hasText: 'Payment error rate' })).toContainText('FIRED');
});

test('switches the theme and loads another demo scenario', async ({ page }) => {
  await page.goto('/tabs/settings');

  await page.locator('ion-segment-button', { hasText: 'Dark' }).click();
  await expect(page.locator('html')).toHaveClass(/ion-palette-dark/);

  await page.locator('ion-select').click();
  await page.getByRole('radio', { name: 'Retry storm' }).click();
  await page.getByRole('button', { name: 'OK' }).click();
  await page.locator('ion-button', { hasText: 'Load scenario' }).click();
  await expect(page.getByText('Retry storm loaded')).toBeVisible();

  // Both settings survive a reload.
  await page.reload();
  await expect(page.locator('html')).toHaveClass(/ion-palette-dark/);
  await expect(page.getByText('(loaded)')).toBeVisible();
  await expect(page.locator('ion-select')).toContainText('Retry storm');
});
