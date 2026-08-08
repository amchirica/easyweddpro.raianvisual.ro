"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, X } from "lucide-react";

import {
  deleteNotificationAction,
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

function formatRelativeTime(
  iso: string,
  t: (key: string, params?: Record<string, string | number>) => string,
): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return t("common.relativeJustNow");
  if (minutes < 60) return t("common.relativeMinutes", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("common.relativeHours", { count: hours });
  const days = Math.floor(hours / 24);
  return t("common.relativeDays", { count: days });
}

/** In-app notifications bell. Renders inert (no fetching) when `enabled` is false — demo mode. */
export function NotificationsBell({ enabled = true }: { enabled?: boolean }) {
  const { t } = useI18n();
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

  async function handleDelete(notification: NotificationRow, event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    const wasUnread = !notification.read_at;
    setNotifications((current) => current.filter((item) => item.id !== notification.id));
    if (wasUnread) setCount((current) => Math.max(0, current - 1));
    await deleteNotificationAction({ notificationId: notification.id });
  }

  if (!enabled) {
    return (
      <Button type="button" variant="ghost" size="icon" aria-label={t("common.notifications")}>
        <Bell className="h-4 w-4" />
      </Button>
    );
  }

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger
        render={
          <Button type="button" variant="ghost" size="icon" className="relative" aria-label={t("common.notifications")} />
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
          <p className="text-sm font-medium text-foreground">{t("common.notifications")}</p>
          {count > 0 ? (
            <Button type="button" variant="ghost" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck data-icon="inline-start" />
              {t("common.markAll")}
            </Button>
          ) : null}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">{t("common.loading")}</p>
          ) : notifications.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-muted-foreground">
              {t("common.noNotifications")}
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
                    <p className="min-w-0 flex-1 text-sm text-foreground">{notification.title}</p>
                    <div className="flex shrink-0 items-center gap-1">
                      {isUnread ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-champagne" />
                      ) : null}
                      <button
                        type="button"
                        aria-label={t("common.delete")}
                        className="rounded p-0.5 text-muted-soft hover:bg-muted hover:text-foreground"
                        onClick={(event) => handleDelete(notification, event)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {notification.body ? (
                    <p className="text-xs text-muted-foreground">{notification.body}</p>
                  ) : null}
                  <p className="text-[11px] text-muted-soft">
                    {formatRelativeTime(notification.created_at, t)}
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
