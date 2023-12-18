import { test, expect } from '@playwright/test';

test('should load the player when user selects animation clip', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByRole('tab', { name: 'Animations' }).click();
  await page.getByRole('tabpanel').getByText('Subscribe').click();

  await expect(page.getByLabel('player')).toHaveCount(1);
});
