import { test, expect } from "@playwright/test";

const e2eEnabled = process.env.E2E_ENABLED === "1";

test.describe("public smoke", () => {
  test.skip(!e2eEnabled, "Set E2E_ENABLED=1 to run browser E2E against a live app.");

  test("home renders brand", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /EasyWedd Pro/i }).first()).toBeVisible();
  });

  test("login page loads", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /autentificare|conectează|login/i })).toBeVisible();
  });

  test("health ready responds", async ({ request }) => {
    const res = await request.get("/api/health/ready");
    expect(res.status()).toBeLessThan(500);
  });
});
