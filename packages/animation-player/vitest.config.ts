import { defineProject } from 'vitest/config';

export default defineProject({
  test: {
    include: ['**/*.spec.browser.{ts,tsx}'],
    name: 'Chrome',
    watch: false,
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true,
    },
  },
});
