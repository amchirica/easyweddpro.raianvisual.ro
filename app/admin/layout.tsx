import type { Metadata } from "next";
import {
  Activity,
  Building2,
  LayoutDashboard,
  Layers,
  Mail,
  MessageSquareWarning,
  ScrollText,
  ServerCog,
  Settings,
  Shield,
  Timer,
  Users,
  Webhook,
  Bug,
  Wallet,
} from "lucide-react";

import { AdminChrome, type AdminNavItem } from "@/components/admin/admin-chrome";
import { AssistantWidget } from "@/components/assistant/assistant-widget";
import {
  canPerformPlatformAction,
  type PlatformAction,
} from "@/lib/platform/permissions";
import { PLATFORM_ROLE_LABELS } from "@/lib/platform/roles";
import { requirePlatformPermission } from "@/lib/platform/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin platformă",
  robots: { index: false, follow: false },
};

const ADMIN_NAV: Array<AdminNavItem & { permission: PlatformAction }> = [
  { href: "/admin", labelKey: "dashboard", icon: LayoutDashboard, permission: "dashboard.read" },
  { href: "/admin/users", labelKey: "adminUsers", icon: Users, permission: "users.read" },
  { href: "/admin/workspaces", labelKey: "adminWorkspaces", icon: Building2, permission: "workspaces.read" },
  { href: "/admin/subscriptions", labelKey: "adminSubscriptions", icon: Wallet, permission: "subscriptions.read" },
  { href: "/admin/plans", labelKey: "adminPlans", icon: Layers, permission: "plans.read" },
  { href: "/admin/emails", labelKey: "adminEmails", icon: Mail, permission: "emails.read" },
  { href: "/admin/email-deliveries", labelKey: "adminDeliveries", icon: Mail, permission: "emails.read" },
  { href: "/admin/cron", labelKey: "adminCron", icon: Timer, permission: "cron.read" },
  { href: "/admin/jobs", labelKey: "adminJobs", icon: Activity, permission: "cron.read" },
  { href: "/admin/webhooks", labelKey: "adminWebhooks", icon: Webhook, permission: "webhooks.read" },
  { href: "/admin/feedback", labelKey: "adminFeedback", icon: MessageSquareWarning, permission: "feedback.read" },
  { href: "/admin/audit", labelKey: "adminAudit", icon: ScrollText, permission: "audit.read" },
  { href: "/admin/system/health", labelKey: "adminHealth", icon: ServerCog, permission: "system.read" },
  { href: "/admin/system/errors", labelKey: "adminErrors", icon: Bug, permission: "system.read" },
  { href: "/admin/settings", labelKey: "adminSettings", icon: Settings, permission: "settings.read" },
  { href: "/admin/admins", labelKey: "adminAdmins", icon: Shield, permission: "admins.read" },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requirePlatformPermission("admin.access");
  const nav = ADMIN_NAV.filter((item) =>
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
