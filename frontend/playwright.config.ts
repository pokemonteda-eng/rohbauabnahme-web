import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: process.env.CI ? 45_000 : 30_000,
  expect: {
    timeout: process.env.CI ? 10_000 : 5_000,
  },
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:5173",
    headless: !!process.env.CI,
    actionTimeout: process.env.CI ? 15_000 : 10_000,
    navigationTimeout: process.env.CI ? 30_000 : 15_000,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  outputDir: "test-results",
});
