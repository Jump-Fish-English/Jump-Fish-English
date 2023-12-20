import { defineWorkspace } from 'vitest/config';

export default defineWorkspace([
  {
    test: {
      include: ['packages/!(video-processor)/**/*.spec.{ts,tsx}'],
      name: 'jsdom',
      environment: 'jsdom',
      globals: true,
    },
  },
  {
    test: {
      include: ['packages/video-processor/**/*.spec.{ts,tsx}'],
      name: 'video-processor',
      globals: true,
    },
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
    },
  },
]);
