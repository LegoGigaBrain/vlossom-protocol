/**
 * Playwright E2E Test Configuration (F4.6)
 * Reference: docs/specs/milestone-4/F4.6-e2e-testing.md
 */

import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// dotenv.config({ path: '.env.test' });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./e2e",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    /* Take screenshot on failure */
    screenshot: "only-on-failure",

    /* Video recording */
    video: "retain-on-failure",
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },

    {
      name: "firefox",
      use: { ...devices["Desktop Firefox"] },
    },

    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },

    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "Mobile Safari",
      use: { ...devices["iPhone 12"] },
    },
  ],

  /* Run your local dev servers before starting the tests */
  webServer: [
    {
      command: "pnpm dev",
      cwd: "../../services/api",
      url: "http://localhost:3002/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000, // 2 minutes to start
    },
    {
      command: "pnpm dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120 * 1000, // 2 minutes to start
    },
  ],

  /* Maximum time one test can run for */
  timeout: 30 * 1000,

  /* Maximum time expect() should wait for the condition to be met */
  expect: {
    timeout: 5000,
  },

  /* Global setup/teardown */
  // globalSetup: require.resolve('./e2e/global-setup'),
  // globalTeardown: require.resolve('./e2e/global-teardown'),
});
