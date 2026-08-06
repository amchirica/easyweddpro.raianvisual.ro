import "server-only";

import type { WorkspaceRole } from "@/lib/constants";
import {
  canPerformWorkspaceAction,
  permissionsForRole,
  type WorkspaceAction,
} from "@/lib/workspace/role-permissions";
import { requireWorkspace, type WorkspaceContext } from "@/lib/workspace/session";

export type { WorkspaceAction };
export { canPerformWorkspaceAction, permissionsForRole };

export async function getCurrentMembership() {
  const ctx = await requireWorkspace();
  return {
    workspaceId: ctx.activeWorkspace.id,
    role: ctx.role,
    membershipId:
      ctx.workspaces.find((w) => w.workspace.id === ctx.activeWorkspace.id)?.membershipId ??
      null,
    userId: ctx.user.id,
  };
}

export async function getCurrentWorkspaceRole(): Promise<WorkspaceRole> {
  const ctx = await requireWorkspace();
  return ctx.role;
}

const INSPECT_ALLOWED_ACTIONS = new Set<WorkspaceAction>([
  "crm.read",
  "analytics.read",
  "billing.read",
]);

export async function requireWorkspaceAction(
  action: WorkspaceAction,
): Promise<WorkspaceContext> {
  const ctx = await requireWorkspace();
  if (ctx.isInspecting && !INSPECT_ALLOWED_ACTIONS.has(action)) {
    throw new Error("forbidden_inspect_readonly");
  }
  if (!canPerformWorkspaceAction(ctx.role, action)) {
    throw new Error("forbidden");
  }
  return ctx;
}
