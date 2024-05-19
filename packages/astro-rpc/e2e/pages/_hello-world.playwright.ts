import { test, expect } from '@playwright/test';

test('hello world', async ({ page }) => {
  await page.goto('/hello-world');
  await expect(page.getByText('Hello World')).toHaveCount(1);
});
