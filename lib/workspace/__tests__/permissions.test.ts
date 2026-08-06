import { describe, expect, it } from "vitest";

import {
  canPerformWorkspaceAction,
  permissionsForRole,
} from "@/lib/workspace/role-permissions";

describe("workspace permissions matrix", () => {
  it("gives owner full operational control", () => {
    expect(canPerformWorkspaceAction("owner", "contracts.write")).toBe(true);
    expect(canPerformWorkspaceAction("owner", "payments.delete")).toBe(true);
    expect(canPerformWorkspaceAction("owner", "members.manage")).toBe(true);
    expect(canPerformWorkspaceAction("owner", "automations.manage")).toBe(true);
  });

  it("restricts manager from members and ownership-level billing mutate", () => {
    expect(canPerformWorkspaceAction("manager", "projects.write")).toBe(true);
    expect(canPerformWorkspaceAction("manager", "members.manage")).toBe(false);
    expect(canPerformWorkspaceAction("manager", "workspace.manage")).toBe(false);
  });

  it("allows sales payments write but not delete", () => {
    expect(canPerformWorkspaceAction("sales", "payments.write")).toBe(true);
    expect(canPerformWorkspaceAction("sales", "payments.delete")).toBe(false);
    expect(canPerformWorkspaceAction("sales", "contracts.write")).toBe(false);
  });

  it("limits collaborator to assigned task write", () => {
    expect(canPerformWorkspaceAction("collaborator", "tasks.write")).toBe(true);
    expect(canPerformWorkspaceAction("collaborator", "projects.write")).toBe(false);
    expect(permissionsForRole("collaborator").isAssigneeOnly).toBe(true);
  });

  it("keeps viewer read-only", () => {
    expect(canPerformWorkspaceAction("viewer", "crm.read")).toBe(true);
    expect(canPerformWorkspaceAction("viewer", "tasks.write")).toBe(false);
    expect(permissionsForRole("viewer").isReadOnly).toBe(true);
  });
});
