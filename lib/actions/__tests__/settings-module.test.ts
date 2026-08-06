import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/workspace/permissions", () => ({
  requireWorkspaceAction: vi.fn(async () => {
    throw new Error("not_used_in_import_test");
  }),
}));

vi.mock("@/lib/workspace/session", () => ({
  requireWorkspace: vi.fn(async () => {
    throw new Error("not_used_in_import_test");
  }),
}));

vi.mock("@/lib/activity/log", () => ({
  logActivity: vi.fn(),
}));

describe("settings server actions module", () => {
  it("can be imported without runtime reference errors", async () => {
    const actions = await import("@/lib/actions/settings");
    expect(actions.updateProfileAction).toBeDefined();
    expect(actions.updateWorkspaceAction).toBeDefined();
    expect(actions.uploadWorkspaceLogoAction).toBeDefined();
    expect(actions.removeWorkspaceLogoAction).toBeDefined();
    expect(actions.deleteWorkspaceAction).toBeDefined();
    expect(actions.requestOwnershipTransferAction).toBeDefined();
  });

  it("rejects invalid profile input before touching the workspace", async () => {
    const actions = await import("@/lib/actions/settings");
    const result = await actions.updateProfileAction({ fullName: "" });
    expect(result.error).toBeTruthy();
  });

  it("rejects an empty delete confirmation before touching the workspace", async () => {
    const actions = await import("@/lib/actions/settings");
    const result = await actions.deleteWorkspaceAction({ confirmation: "" });
    expect(result.error).toBeTruthy();
  });
});
