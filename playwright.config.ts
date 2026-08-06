import { defineConfig, devices } from "@playwright/test";

const e2eEnabled = process.env.E2E_ENABLED === "1";
const baseURL = process.env.E2E_BASE_URL ?? "http://127.0.0.1:3000";

/**
 * Scaffold only — specs skip unless E2E_ENABLED=1.
 * Local: E2E_ENABLED=1 npm run test:e2e
 * CI: set E2E_ENABLED=1 and a reachable E2E_BASE_URL (or start webServer).
 */
export default defineConfig({
  testDir: "tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
  timeout: 60_000,
  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: e2eEnabled
    ? {
        command: "npm run dev",
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      }
    : undefined,
});
