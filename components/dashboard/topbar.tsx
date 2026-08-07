"use client";

import Link from "next/link";
import { Menu, Plus } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { LocaleSwitcher } from "@/components/i18n/locale-switcher";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { useI18n } from "@/components/providers/i18n-provider";
import { GlobalSearch } from "@/components/search/global-search";
import { ThemeSwitcher } from "@/components/theme/theme-switcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type TopbarProps = {
  onOpenMobileNav: () => void;
  workspaceName?: string;
  userName?: string;
  isDemo?: boolean;
};

function getInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"
  );
}

export function Topbar({ onOpenMobileNav, workspaceName, userName, isDemo = false }: TopbarProps) {
  const { t } = useI18n();
  const hour = new Date().getHours();
  const greeting =
    hour < 12
      ? t("nav.greetingMorning")
      : hour < 18
        ? t("nav.greetingAfternoon")
        : t("nav.greetingEvening");
  const displayUserName = userName || t("nav.userFallback");
  const displayWorkspaceName = workspaceName || t("nav.workspaceFallback");
  const avatarInitials = getInitials(displayUserName);

  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <div className="flex items-center gap-3 px-4 py-3 md:px-6">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onOpenMobileNav}
          aria-label={t("common.openMenu")}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-muted-foreground">
            {greeting}, <span className="text-foreground">{displayUserName}</span>
          </p>
          <p className="truncate text-xs text-muted-soft">{displayWorkspaceName}</p>
        </div>

        <div className="hidden max-w-xs flex-1 md:block lg:max-w-sm">
          <GlobalSearch mode="workspace" enableShortcut />
        </div>

        <div className="md:hidden">
          <GlobalSearch mode="workspace" compact enableShortcut={false} />
        </div>

        <Button type="button" className="hidden sm:inline-flex" render={<Link href="/dashboard/leads" />} nativeButton={false}>
          <Plus data-icon="inline-start" />
          {t("nav.quickAction")}
        </Button>

        <LocaleSwitcher className="hidden sm:inline-flex" />
        <ThemeSwitcher />

        <NotificationsBell enabled={!isDemo} />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label={t("nav.profileMenu")} />
            }
          >
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-champagne/15 text-champagne">
                {avatarInitials}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem nativeButton={false} render={<Link href="/dashboard/settings" />}>
              {t("nav.settings")}
            </DropdownMenuItem>
            <DropdownMenuItem nativeButton={false} render={<Link href="/dashboard/team" />}>
              {t("nav.team")}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isDemo ? (
              <DropdownMenuItem nativeButton={false} render={<Link href="/login" />}>
                {t("common.signOut")}
              </DropdownMenuItem>
            ) : (
              <LogoutButton />
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
