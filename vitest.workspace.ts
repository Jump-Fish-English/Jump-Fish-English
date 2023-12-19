import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      include: ['**/*.spec.{ts,tsx}'],
      name: 'jsdom',
      environment: 'jsdom',
      globals: true,
    }
  },
  {
    test: {
      include: ['**/*.spec.browser.{ts,tsx}'],
      name: 'Chrome',
      browser: {
        enabled: true,
        provider: 'playwright',
        name: 'chromium',
        headless: true,
      },
    }
  },
]);
