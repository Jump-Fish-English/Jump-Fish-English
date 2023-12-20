import { test, expect } from '@playwright/test';

test('post body string', async ({ page }) => {
  await page.goto('/post-body-string');
  await expect(page.getByText('What a wonderful message')).toHaveCount(1);
});