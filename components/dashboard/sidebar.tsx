"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronsLeft, ChevronsRight } from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { DASHBOARD_NAV } from "@/components/dashboard/nav-config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
  className?: string;
  onNavigate?: () => void;
  workspaceName?: string;
  isDemo?: boolean;
};

export function Sidebar({
  collapsed,
  onToggle,
  className,
  onNavigate,
  workspaceName,
}: SidebarProps) {
  const pathname = usePathname();
  const displayWorkspaceName = workspaceName || "Workspace";

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-[width] duration-200",
        collapsed ? "w-[76px]" : "w-[260px]",
        className,
      )}
    >
      <div className={cn("flex items-center gap-2 border-b border-sidebar-border px-3 py-4", collapsed && "justify-center")}>
        <BrandLogo
          href="/dashboard"
          showWordmark={!collapsed}
          size={collapsed ? "collapsed" : "sm"}
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4" aria-label="Navigare principală">
        {DASHBOARD_NAV.map((item) => {
          const active =
            item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm transition-colors",
                collapsed && "justify-center px-0",
                active
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {!collapsed ? <span>{item.label}</span> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border p-3">
        {!collapsed ? (
          <div className="mb-3 rounded-xl border border-border bg-background/40 px-3 py-2">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">Workspace</p>
            <p className="truncate text-sm text-foreground">{displayWorkspaceName}</p>
          </div>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="w-full justify-center"
          onClick={onToggle}
          aria-label={collapsed ? "Extinde sidebar" : "Restrânge sidebar"}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          {!collapsed ? <span className="ml-2">Restrânge</span> : null}
        </Button>
      </div>
    </aside>
  );
}
