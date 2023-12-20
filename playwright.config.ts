import { defineConfig, devices } from '@playwright/test';

const headless = process.env.HEADLESS !== 'false';

export default defineConfig({
  fullyParallel: true,
  webServer: [{
    command: 'npm run dev -w @jumpfish/video-processor',
    url: 'http://localhost:5173',
    timeout: 120 * 1000
  },],
  projects: [{
    name: 'hello',
    testMatch: 'packages/video-processor/**/*.playwright.ts',
    use: {
      baseURL: 'http://localhost:5173',
      ...devices['Desktop Chrome'],
      channel: 'chrome',
      headless,
    },
    snapshotDir: 'packages/video-processor/snapshots',
    timeout: 120000,
    expect: {
      timeout: 120000
    }
  }]
});