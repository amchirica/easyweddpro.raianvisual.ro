import { test, expect } from "@playwright/test";

const e2eEnabled = process.env.E2E_ENABLED === "1";

test.describe("auth gates", () => {
  test.skip(!e2eEnabled, "Set E2E_ENABLED=1 to run browser E2E against a live app.");

  test("dashboard redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });

  test("settings billing redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard/settings/billing");
    await expect(page).toHaveURL(/\/login/);
  });
});
