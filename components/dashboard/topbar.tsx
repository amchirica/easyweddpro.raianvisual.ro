"use client";

import Link from "next/link";
import { Menu, Plus, Search } from "lucide-react";

import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationsBell } from "@/components/notifications/notifications-bell";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

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
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bună dimineața" : hour < 18 ? "Bună ziua" : "Bună seara";
  const displayUserName = userName || "Utilizator";
  const displayWorkspaceName = workspaceName || "Workspace";
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
          aria-label="Deschide meniul"
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
          <label className="relative block">
            <span className="sr-only">Căutare globală</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Caută leaduri, clienți, oferte, contracte, proiecte, evenimente…"
              className="h-10 bg-card/60 pl-9"
            />
          </label>
        </div>

        <Button type="button" className="hidden sm:inline-flex" render={<Link href="/dashboard/leads" />} nativeButton={false}>
          <Plus data-icon="inline-start" />
          Quick action
        </Button>

        <NotificationsBell enabled={!isDemo} />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button type="button" variant="ghost" size="icon" className="rounded-full" aria-label="Meniu profil" />
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
              Setări
            </DropdownMenuItem>
            <DropdownMenuItem nativeButton={false} render={<Link href="/dashboard/team" />}>
              Echipă
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {isDemo ? (
              <DropdownMenuItem nativeButton={false} render={<Link href="/login" />}>
                Ieși din demo
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
