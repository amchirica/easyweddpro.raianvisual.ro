import Link from "next/link";
import type { Metadata } from "next";
import { LayoutDashboard, Users, Wallet, Building2, Layers, ScrollText } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { requirePlatformAdmin } from "@/lib/workspace/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin platformă",
  robots: { index: false, follow: false },
};

const ADMIN_NAV = [
  { href: "/admin", label: "Prezentare", icon: LayoutDashboard },
  { href: "/admin/workspaces", label: "Workspace-uri", icon: Building2 },
  { href: "/admin/users", label: "Utilizatori", icon: Users },
  { href: "/admin/subscriptions", label: "Abonamente", icon: Wallet },
  { href: "/admin/plans", label: "Planuri", icon: Layers },
  { href: "/admin/audit", label: "Audit", icon: ScrollText },
];

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Every route under app/admin/** is guarded here — redirects non platform-admins to /dashboard.
  await requirePlatformAdmin();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo size="sm" />
            <span className="rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium text-champagne-soft">
              Admin platformă
            </span>
          </div>
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            {ADMIN_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <item.icon className="h-3.5 w-3.5" aria-hidden />
                {item.label}
              </Link>
            ))}
          </nav>
          <Link href="/dashboard" className="text-xs text-muted-soft hover:text-foreground">
            Ieși din admin
          </Link>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
    </div>
  );
}
