import { test, expect } from "@playwright/test";

const e2eEnabled = process.env.E2E_ENABLED === "1";

test.describe("legal pages", () => {
  test.skip(!e2eEnabled, "Set E2E_ENABLED=1 to run browser E2E against a live app.");

  for (const path of ["/privacy", "/terms", "/cookies", "/dpa", "/security"]) {
    test(`${path} is reachable`, async ({ page }) => {
      const res = await page.goto(path);
      expect(res?.ok()).toBeTruthy();
      await expect(page.locator("h1")).toBeVisible();
    });
  }
});
