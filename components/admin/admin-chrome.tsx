"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

import { AdminEnvBadge } from "@/components/admin/admin-env-badge";
import { BrandLogo } from "@/components/brand/brand-logo";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { useI18n } from "@/components/providers/i18n-provider";
import { GlobalSearch } from "@/components/search/global-search";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";

export type AdminNavItem = {
  href: string;
  labelKey: string;
  icon: LucideIcon;
};

export function AdminChrome({
  roleLabel,
  nav,
  children,
}: {
  roleLabel: string;
  nav: AdminNavItem[];
  children: React.ReactNode;
}) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b border-border bg-background/90 backdrop-blur-lg">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <BrandLogo href="/admin" size="sm" showWordmark={false} />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium text-champagne-soft">
                  {t("nav.admin")}
                </span>
                <AdminEnvBadge />
              </div>
              <p className="text-[11px] text-muted-soft">{roleLabel}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden w-64 md:block">
              <GlobalSearch mode="platform" />
            </div>
            <LocaleSwitcher className="hidden sm:inline-flex" />
            <ThemeSwitcher />
            <Link href="/dashboard" className="text-xs text-muted-soft hover:text-foreground">
              {t("nav.exitAdmin")}
            </Link>
          </div>
        </div>
        <nav className="mx-auto flex w-full max-w-7xl gap-1 overflow-x-auto px-6 pb-3 text-sm text-muted-foreground">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-surface-elevated hover:text-foreground"
            >
              <item.icon className="h-3.5 w-3.5" aria-hidden />
              {t(`nav.${item.labelKey}`)}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto w-full max-w-7xl px-6 py-10">{children}</main>
    </div>
  );
}
