import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/data/admin", () => ({
  listUsersForAdmin: vi.fn(async () => [
    { id: "u1", fullName: "Admin User", email: "a@x.ro" },
  ]),
  listWorkspacesForAdmin: vi.fn(async () => [
    { id: "w1", name: "Studio X", slug: "studio-x", city: "București" },
  ]),
  listSubscriptionsForAdmin: vi.fn(async () => [
    { id: "s1", workspaceName: "Studio X", plan: "studio", status: "active" },
  ]),
}));

import { searchPlatform } from "@/lib/search/platform-search";

describe("searchPlatform", () => {
  it("returns detail hrefs for super admin", async () => {
    const groups = await searchPlatform({} as never, "studio", "platform_super_admin");
    const byKey = Object.fromEntries(groups.map((g) => [g.key, g]));
    expect(byKey.workspaces.items[0].href).toBe("/admin/workspaces/w1");
    expect(byKey.subscriptions.items[0].href).toBe("/admin/subscriptions/s1");
    expect(byKey.plans.items.some((p) => p.href.startsWith("/admin/plans/"))).toBe(true);
  });

  it("respects permission gating for content role", async () => {
    const groups = await searchPlatform({} as never, "studio", "platform_content");
    expect(groups.some((g) => g.key === "users")).toBe(false);
    expect(groups.some((g) => g.key === "workspaces")).toBe(false);
    expect(groups.some((g) => g.key === "subscriptions")).toBe(false);
    expect(groups.some((g) => g.key === "plans")).toBe(true);
  });
});
