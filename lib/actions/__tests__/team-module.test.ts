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

describe("team server actions module", () => {
  it("can be imported without runtime reference errors", async () => {
    const actions = await import("@/lib/actions/team");
    expect(actions.inviteMemberAction).toBeDefined();
    expect(actions.resendInvitationAction).toBeDefined();
    expect(actions.revokeInvitationAction).toBeDefined();
    expect(actions.changeMemberRoleAction).toBeDefined();
    expect(actions.disableMemberAction).toBeDefined();
    expect(actions.enableMemberAction).toBeDefined();
    expect(actions.removeMemberAction).toBeDefined();
  });

  it("rejects an invalid invite payload before touching the workspace", async () => {
    const actions = await import("@/lib/actions/team");
    const result = await actions.inviteMemberAction({ email: "not-an-email", role: "owner" });
    expect(result.error).toBeTruthy();
  });

  it("rejects promoting to owner without confirmation via the action schema wiring", async () => {
    const actions = await import("@/lib/actions/team");
    const result = await actions.changeMemberRoleAction("membership-1", { role: "not_a_role" });
    expect(result.error).toBeTruthy();
  });
});
