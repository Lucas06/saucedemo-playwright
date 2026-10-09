import { defineConfig, devices } from '@playwright/test';
import { env } from './src/config';

export default defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  fullyParallel: true,
  forbidOnly: env.isCI,
  retries: env.isCI ? 2 : 0,
  workers: env.isCI ? 2 : env.workers,
  timeout: 30_000,
  expect: { timeout: 5_000 },

  reporter: [
    [env.isCI ? 'github' : 'list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['junit', { outputFile: 'reports/junit.xml' }],
    ['./reporters/failure-summary.ts', { outputDir: 'reports', redact: [env.password] }],
  ],

  use: {
    baseURL: env.baseUrl,
    // saucedemo tags elements with `data-test`, so `getByTestId()` targets it directly.
    testIdAttribute: 'data-test',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Broaden coverage by adding projects (run `npx playwright install` first):
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit', use: { ...devices['Desktop Safari'] } },
  ],
});
