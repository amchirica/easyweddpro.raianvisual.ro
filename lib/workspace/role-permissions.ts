import type { WorkspaceRole } from "@/lib/constants";

export type WorkspaceAction =
  | "crm.read"
  | "crm.write"
  | "crm.delete"
  | "sales.write"
  | "proposals.write"
  | "proposals.delete"
  | "contracts.write"
  | "contracts.delete"
  | "calendar.write"
  | "projects.write"
  | "projects.delete"
  | "tasks.write"
  | "tasks.delete"
  | "payments.write"
  | "payments.delete"
  | "templates.write"
  | "automations.manage"
  | "analytics.read"
  | "workspace.manage"
  | "members.manage"
  | "billing.read"
  | "activity.write";

const ALL_OPS: WorkspaceAction[] = [
  "crm.read",
  "crm.write",
  "crm.delete",
  "sales.write",
  "proposals.write",
  "proposals.delete",
  "contracts.write",
  "contracts.delete",
  "calendar.write",
  "projects.write",
  "projects.delete",
  "tasks.write",
  "tasks.delete",
  "payments.write",
  "payments.delete",
  "templates.write",
  "automations.manage",
  "analytics.read",
  "workspace.manage",
  "members.manage",
  "billing.read",
  "activity.write",
];

const ROLE_ACTIONS: Record<WorkspaceRole, WorkspaceAction[]> = {
  owner: ALL_OPS,
  admin: ALL_OPS,
  manager: [
    "crm.read",
    "crm.write",
    "crm.delete",
    "sales.write",
    "proposals.write",
    "proposals.delete",
    "contracts.write",
    "calendar.write",
    "projects.write",
    "projects.delete",
    "tasks.write",
    "tasks.delete",
    "payments.write",
    "templates.write",
    "automations.manage",
    "analytics.read",
    "billing.read",
    "activity.write",
  ],
  sales: [
    "crm.read",
    "crm.write",
    "sales.write",
    "proposals.write",
    "calendar.write",
    "tasks.write",
    "payments.write",
    "analytics.read",
    "billing.read",
    "activity.write",
  ],
  editor: [
    "crm.read",
    "calendar.write",
    "projects.write",
    "tasks.write",
    "analytics.read",
    "billing.read",
    "activity.write",
  ],
  collaborator: ["crm.read", "tasks.write", "billing.read"],
  viewer: ["crm.read", "analytics.read", "billing.read"],
};

export function canPerformWorkspaceAction(
  role: WorkspaceRole | null | undefined,
  action: WorkspaceAction,
): boolean {
  if (!role) return false;
  return ROLE_ACTIONS[role]?.includes(action) ?? false;
}

export function permissionsForRole(role: WorkspaceRole | null | undefined) {
  return {
    canWriteCrm: canPerformWorkspaceAction(role, "crm.write"),
    canDeleteCrm: canPerformWorkspaceAction(role, "crm.delete"),
    canWriteProposals: canPerformWorkspaceAction(role, "proposals.write"),
    canDeleteProposals: canPerformWorkspaceAction(role, "proposals.delete"),
    canWriteContracts: canPerformWorkspaceAction(role, "contracts.write"),
    canDeleteContracts: canPerformWorkspaceAction(role, "contracts.delete"),
    canWriteCalendar: canPerformWorkspaceAction(role, "calendar.write"),
    canWriteProjects: canPerformWorkspaceAction(role, "projects.write"),
    canDeleteProjects: canPerformWorkspaceAction(role, "projects.delete"),
    canWriteTasks: canPerformWorkspaceAction(role, "tasks.write"),
    canDeleteTasks: canPerformWorkspaceAction(role, "tasks.delete"),
    canWritePayments: canPerformWorkspaceAction(role, "payments.write"),
    canDeletePayments: canPerformWorkspaceAction(role, "payments.delete"),
    canWriteTemplates: canPerformWorkspaceAction(role, "templates.write"),
    canManageAutomations: canPerformWorkspaceAction(role, "automations.manage"),
    canReadAnalytics: canPerformWorkspaceAction(role, "analytics.read"),
    canManageWorkspace: canPerformWorkspaceAction(role, "workspace.manage"),
    canManageMembers: canPerformWorkspaceAction(role, "members.manage"),
    isReadOnly: role === "viewer",
    isAssigneeOnly: role === "collaborator" || role === "editor",
  };
}
