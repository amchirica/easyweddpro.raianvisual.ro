import type { Metadata } from "next";

import { CalendarBoard } from "@/components/calendar/calendar-board";
import { mapCalendarEventRow, type CalendarEventItem } from "@/lib/calendar/mappers";
import { listCalendarEvents } from "@/lib/data/calendar";
import { listClients } from "@/lib/data/clients";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Calendar · EasyWedd Pro",
};

/** Loads a buffer of one month before/after the current month so month/week/day/list views can navigate without refetching. */
function bufferedRange(): { rangeStart: string; rangeEnd: string } {
  const now = new Date();
  const rangeStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const rangeEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0, 23, 59, 59, 999);
  return { rangeStart: rangeStart.toISOString(), rangeEnd: rangeEnd.toISOString() };
}

export default async function CalendarPage() {
  const ctx = await requireWorkspace();
  const permissions = permissionsForRole(ctx.role);
  const { rangeStart, rangeEnd } = bufferedRange();

  let events: CalendarEventItem[] = [];
  let clients: Array<{ id: string; name: string }> = [];
  let error: string | null = null;

  try {
    const [eventRows, clientRows] = await Promise.all([
      listCalendarEvents(ctx.supabase, ctx.activeWorkspace.id, {
        rangeStart,
        rangeEnd,
        limit: 500,
      }),
      listClients(ctx.supabase, ctx.activeWorkspace.id, { limit: 200 }),
    ]);
    events = eventRows.map(mapCalendarEventRow);
    clients = clientRows.map((client) => ({ id: client.id, name: client.name }));
  } catch (err) {
    error = err instanceof Error ? err.message : "Nu am putut încărca evenimentele calendarului.";
  }

  return (
    <CalendarBoard
      initialEvents={events}
      canWrite={permissions.canWriteCalendar}
      clients={clients}
      error={error}
    />
  );
}
