import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/workspace/permissions", () => ({
  requireWorkspaceAction: vi.fn(async () => {
    throw new Error("forbidden");
  }),
}));

vi.mock("@/lib/platform/session", () => ({
  getPlatformAdminContext: vi.fn(async () => null),
}));

vi.mock("@/lib/search/workspace-search", () => ({
  searchWorkspace: vi.fn(async () => [{ key: "leads", items: [] }]),
}));

vi.mock("@/lib/search/platform-search", () => ({
  searchPlatform: vi.fn(async () => [{ key: "users", items: [] }]),
}));

import { searchPlatformAction, searchWorkspaceAction } from "@/lib/actions/search";

describe("search actions", () => {
  it("returns empty groups under min chars", async () => {
    const result = await searchWorkspaceAction("a");
    expect(result.error).toBeUndefined();
    expect(result.data?.groups).toEqual([]);
  });

  it("denies workspace search without permission", async () => {
    const result = await searchWorkspaceAction("ana");
    expect(result.error).toBe("forbidden");
  });

  it("denies platform search without admin context", async () => {
    const result = await searchPlatformAction("ana");
    expect(result.error).toBe("forbidden");
  });
});
