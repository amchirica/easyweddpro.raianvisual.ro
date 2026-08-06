import Link from "next/link";
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

import { AdminEnvBadge } from "@/components/admin/admin-env-badge";
import { BrandLogo } from "@/components/brand/brand-logo";
import {
  ADMIN_NAV_PERMISSIONS,
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

const ADMIN_NAV: Array<{
  href: keyof typeof ADMIN_NAV_PERMISSIONS | string;
  label: string;
  icon: typeof LayoutDashboard;
  permission: PlatformAction;
}> = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, permission: "dashboard.read" },
  { href: "/admin/users", label: "Utilizatori", icon: Users, permission: "users.read" },
  { href: "/admin/workspaces", label: "Workspace-uri", icon: Building2, permission: "workspaces.read" },
  { href: "/admin/subscriptions", label: "Abonamente", icon: Wallet, permission: "subscriptions.read" },
  { href: "/admin/plans", label: "Planuri", icon: Layers, permission: "plans.read" },
  { href: "/admin/emails", label: "Emailuri", icon: Mail, permission: "emails.read" },
  { href: "/admin/email-deliveries", label: "Deliveries", icon: Mail, permission: "emails.read" },
  { href: "/admin/cron", label: "Cron", icon: Timer, permission: "cron.read" },
  { href: "/admin/jobs", label: "Jobs", icon: Activity, permission: "cron.read" },
  { href: "/admin/webhooks", label: "Webhook-uri", icon: Webhook, permission: "webhooks.read" },
  { href: "/admin/feedback", label: "Feedback", icon: MessageSquareWarning, permission: "feedback.read" },
  { href: "/admin/audit", label: "Audit", icon: ScrollText, permission: "audit.read" },
  { href: "/admin/system/health", label: "Health", icon: ServerCog, permission: "system.read" },
  { href: "/admin/system/errors", label: "Erori", icon: Bug, permission: "system.read" },
  { href: "/admin/settings", label: "Configurări", icon: Settings, permission: "settings.read" },
  { href: "/admin/admins", label: "Administratori", icon: Shield, permission: "admins.read" },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const admin = await requirePlatformPermission("admin.access");
  const nav = ADMIN_NAV.filter((item) =>
    canPerformPlatformAction(admin.platformRole, item.permission),
  );

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo href="/admin" size="sm" showWordmark={false} />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium text-champagne-soft">
                  Admin platformă
                </span>
                <AdminEnvBadge />
              </div>
              <p className="text-[11px] text-muted-soft">
                {PLATFORM_ROLE_LABELS[admin.platformRole]}
              </p>
            </div>
          </div>
          <Link href="/dashboard" className="text-xs text-muted-soft hover:text-foreground">
            Ieși din admin
          </Link>
        </div>
        <nav className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-6 pb-3 text-sm text-muted-foreground">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-surface-elevated hover:text-foreground"
            >
              <item.icon className="h-3.5 w-3.5" aria-hidden />
              {item.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
