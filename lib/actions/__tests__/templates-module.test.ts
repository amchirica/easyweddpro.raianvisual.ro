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

vi.mock("@/lib/activity/log", () => ({
  logActivity: vi.fn(),
}));

describe("templates server actions module", () => {
  it("can be imported without runtime reference errors", async () => {
    const actions = await import("@/lib/actions/templates");
    expect(actions.createTemplateAction).toBeDefined();
    expect(actions.updateTemplateAction).toBeDefined();
    expect(actions.duplicateTemplateAction).toBeDefined();
    expect(actions.setDefaultTemplateAction).toBeDefined();
    expect(actions.archiveTemplateAction).toBeDefined();
    expect(actions.unarchiveTemplateAction).toBeDefined();
    expect(actions.softDeleteTemplateAction).toBeDefined();
  });

  it("rejects invalid input before touching the workspace", async () => {
    const actions = await import("@/lib/actions/templates");
    const result = await actions.createTemplateAction({ type: "not_a_type", name: "" });
    expect(result.error).toBeTruthy();
    expect(result.data).toBeUndefined();
  });
});
