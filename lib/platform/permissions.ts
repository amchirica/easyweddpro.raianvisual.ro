import type { PlatformRole } from "@/lib/platform/roles";

export type PlatformAction =
  | "admin.access"
  | "dashboard.read"
  | "users.read"
  | "users.write"
  | "workspaces.read"
  | "workspaces.write"
  | "workspaces.inspect"
  | "subscriptions.read"
  | "subscriptions.write"
  | "plans.read"
  | "plans.write"
  | "emails.read"
  | "emails.write"
  | "cron.read"
  | "cron.run"
  | "webhooks.read"
  | "webhooks.write"
  | "feedback.read"
  | "feedback.write"
  | "audit.read"
  | "audit.export"
  | "system.read"
  | "system.write"
  | "settings.read"
  | "settings.write"
  | "admins.read"
  | "admins.write"
  | "content.read"
  | "content.write"
  | "features.read"
  | "features.write";

const ALL: PlatformAction[] = [
  "admin.access",
  "dashboard.read",
  "users.read",
  "users.write",
  "workspaces.read",
  "workspaces.write",
  "workspaces.inspect",
  "subscriptions.read",
  "subscriptions.write",
  "plans.read",
  "plans.write",
  "emails.read",
  "emails.write",
  "cron.read",
  "cron.run",
  "webhooks.read",
  "webhooks.write",
  "feedback.read",
  "feedback.write",
  "audit.read",
  "audit.export",
  "system.read",
  "system.write",
  "settings.read",
  "settings.write",
  "admins.read",
  "admins.write",
  "content.read",
  "content.write",
  "features.read",
  "features.write",
];

const ROLE_ACTIONS: Record<PlatformRole, PlatformAction[]> = {
  platform_super_admin: ALL,
  platform_admin: ALL.filter((a) => a !== "admins.write" && a !== "settings.write"),
  platform_support: [
    "admin.access",
    "dashboard.read",
    "users.read",
    "workspaces.read",
    "workspaces.inspect",
    "subscriptions.read",
    "plans.read",
    "emails.read",
    "emails.write",
    "feedback.read",
    "feedback.write",
    "audit.read",
    "system.read",
  ],
  platform_billing: [
    "admin.access",
    "dashboard.read",
    "users.read",
    "workspaces.read",
    "subscriptions.read",
    "subscriptions.write",
    "plans.read",
    "plans.write",
    "webhooks.read",
    "webhooks.write",
    "audit.read",
    "system.read",
  ],
  platform_content: [
    "admin.access",
    "dashboard.read",
    "content.read",
    "content.write",
    "plans.read",
    "audit.read",
  ],
  platform_developer: [
    "admin.access",
    "dashboard.read",
    "cron.read",
    "cron.run",
    "webhooks.read",
    "webhooks.write",
    "emails.read",
    "system.read",
    "system.write",
    "features.read",
    "features.write",
    "audit.read",
  ],
};

export function canPerformPlatformAction(
  role: PlatformRole | null | undefined,
  action: PlatformAction,
): boolean {
  if (!role) return false;
  return ROLE_ACTIONS[role]?.includes(action) ?? false;
}

export function permissionsForPlatformRole(role: PlatformRole): Set<PlatformAction> {
  return new Set(ROLE_ACTIONS[role] ?? []);
}

/** Map admin nav href → required permission. */
export const ADMIN_NAV_PERMISSIONS: Record<string, PlatformAction> = {
  "/admin": "dashboard.read",
  "/admin/users": "users.read",
  "/admin/workspaces": "workspaces.read",
  "/admin/subscriptions": "subscriptions.read",
  "/admin/plans": "plans.read",
  "/admin/emails": "emails.read",
  "/admin/email-deliveries": "emails.read",
  "/admin/cron": "cron.read",
  "/admin/jobs": "cron.read",
  "/admin/webhooks": "webhooks.read",
  "/admin/feedback": "feedback.read",
  "/admin/audit": "audit.read",
  "/admin/system/health": "system.read",
  "/admin/system/errors": "system.read",
  "/admin/settings": "settings.read",
  "/admin/admins": "admins.read",
};
