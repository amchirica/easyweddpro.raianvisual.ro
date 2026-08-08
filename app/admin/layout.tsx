import type { Metadata } from "next";

import {
  AdminChrome,
  type AdminNavItem,
} from "@/components/admin/admin-chrome";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import {
  canPerformPlatformAction,
  type PlatformAction,
} from "@/lib/platform/permissions";
import { PLATFORM_ROLE_LABELS } from "@/lib/platform/roles";
import { requirePlatformPermission } from "@/lib/platform/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "EasyWedd Pro Admin",
  robots: { index: false, follow: false },
};

const ADMIN_NAV: Array<AdminNavItem & { permission: PlatformAction }> = [
  { href: "/admin", labelKey: "dashboard", icon: "layout-dashboard", permission: "dashboard.read" },
  { href: "/admin/users", labelKey: "adminUsers", icon: "users", permission: "users.read" },
  { href: "/admin/workspaces", labelKey: "adminWorkspaces", icon: "building", permission: "workspaces.read" },
  { href: "/admin/subscriptions", labelKey: "adminSubscriptions", icon: "wallet", permission: "subscriptions.read" },
  { href: "/admin/plans", labelKey: "adminPlans", icon: "layers", permission: "plans.read" },
  { href: "/admin/emails", labelKey: "adminEmails", icon: "mail", permission: "emails.read" },
  { href: "/admin/email-deliveries", labelKey: "adminDeliveries", icon: "mail", permission: "emails.read" },
  { href: "/admin/cron", labelKey: "adminCron", icon: "timer", permission: "cron.read" },
  { href: "/admin/jobs", labelKey: "adminJobs", icon: "activity", permission: "cron.read" },
  { href: "/admin/webhooks", labelKey: "adminWebhooks", icon: "webhook", permission: "webhooks.read" },
  { href: "/admin/feedback", labelKey: "adminFeedback", icon: "feedback", permission: "feedback.read" },
  { href: "/admin/audit", labelKey: "adminAudit", icon: "audit", permission: "audit.read" },
  { href: "/admin/system/health", labelKey: "adminHealth", icon: "system", permission: "system.read" },
  { href: "/admin/system/errors", labelKey: "adminErrors", icon: "bug", permission: "system.read" },
  { href: "/admin/settings", labelKey: "adminSettings", icon: "settings", permission: "settings.read" },
  { href: "/admin/admins", labelKey: "adminAdmins", icon: "shield", permission: "admins.read" },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requirePlatformPermission("admin.access");
  const nav: AdminNavItem[] = ADMIN_NAV.filter((item) =>
    canPerformPlatformAction(admin.platformRole, item.permission),
  ).map(({ href, labelKey, icon }) => ({ href, labelKey, icon }));

  return (
    <>
      <AdminChrome roleLabel={PLATFORM_ROLE_LABELS[admin.platformRole]} nav={nav}>
        {children}
      </AdminChrome>
      <AssistantWidget surface="admin" />
    </>
  );
}
