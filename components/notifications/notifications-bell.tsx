"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck } from "lucide-react";

import {
  listNotificationsAction,
  listUnreadCountAction,
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Database } from "@/types/database";

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

const POLL_INTERVAL_MS = 60_000;

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return "acum";
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} h`;
  const days = Math.floor(hours / 24);
  return `${days} z`;
}

/** In-app notifications bell. Renders inert (no fetching) when `enabled` is false — demo mode. */
export function NotificationsBell({ enabled = true }: { enabled?: boolean }) {
  const [count, setCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const loadedOnceRef = useRef(false);

  const refreshCount = useCallback(async () => {
    if (!enabled) return;
    const result = await listUnreadCountAction();
    if (result?.data) setCount(result.data.count);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    // Poll on mount + interval — external data source, not derived render state.
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional polling fetch
    refreshCount();
    const interval = window.setInterval(refreshCount, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [enabled, refreshCount]);

  async function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!enabled) return;
    if (next && !loadedOnceRef.current) {
      loadedOnceRef.current = true;
      setLoading(true);
      const result = await listNotificationsAction({ limit: 20 });
      setLoading(false);
      if (result?.data) setNotifications(result.data.notifications);
    }
  }

  async function handleMarkRead(notification: NotificationRow) {
    if (notification.read_at) return;
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, read_at: new Date().toISOString() } : item,
      ),
    );
    setCount((current) => Math.max(0, current - 1));
    await markNotificationReadAction({ notificationId: notification.id });
  }

  async function handleMarkAllRead() {
    setNotifications((current) =>
      current.map((item) => ({ ...item, read_at: item.read_at ?? new Date().toISOString() })),
    );
    setCount(0);
    await markAllNotificationsReadAction();
  }

  if (!enabled) {
    return (
      <Button type="button" variant="ghost" size="icon" aria-label="Notificări">
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button type="button" variant="ghost" size="icon" className="relative" aria-label="Notificări" />
        }
      >
        <Bell className="h-4 w-4" />
        {count > 0 ? (
          <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
            {count > 9 ? "9+" : count}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-3 py-2">
          <p className="text-sm font-medium text-foreground">Notificări</p>
          {count > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck data-icon="inline-start" />
              Marchează tot
            </Button>
          ) : null}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">Se încarcă…</p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              Nu ai notificări.
            </p>
          ) : (
            notifications.map((notification) => {
              const isUnread = !notification.read_at;
              const content = (
                <div
                  className={cn(
                    "flex flex-col gap-0.5 border-b border-border/60 px-3 py-2.5 text-left transition-colors last:border-0 hover:bg-muted/60",
                    isUnread && "bg-champagne/5",
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-foreground">{notification.title}</p>
                    {isUnread ? (
                      <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-champagne" />
                    ) : null}
                  </div>
                  {notification.body ? (
                    <p className="text-xs text-muted-foreground">{notification.body}</p>
                  ) : null}
                  <p className="text-[11px] text-muted-soft">
                    {formatRelativeTime(notification.created_at)}
                  </p>
                </div>
              );

              return notification.action_url ? (
                <Link
                  key={notification.id}
                  href={notification.action_url}
                  onClick={() => handleMarkRead(notification)}
                  className="block"
                >
                  {content}
                </Link>
              ) : (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => handleMarkRead(notification)}
                  className="block w-full"
                >
                  {content}
                </button>
              );
            })
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
