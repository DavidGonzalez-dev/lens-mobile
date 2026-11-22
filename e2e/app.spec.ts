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

  await page.getByRole('link', { name: 'View traces' }).click();
  await expect(page).toHaveURL(/\/tabs\/traces\?service=checkout$/);

  const firstTrace = page.locator('ion-item[href^="/tabs/traces/"]').first();
  await expect(firstTrace).toContainText('checkout');
  await firstTrace.click();
  await expect(page).toHaveURL(/\/tabs\/traces\/[^/?]+$/);

  await page.getByText('demo-span', { exact: true }).click();
  await expect(page).toHaveURL(/\/tabs\/traces\/[^/]+\/spans\/demo-span$/);
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
