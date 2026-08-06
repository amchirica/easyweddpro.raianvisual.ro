import type { CalendarEventStatus } from "@/lib/constants";
import type { Database } from "@/types/database";

export type CalendarEventRow = Database["public"]["Tables"]["calendar_events"]["Row"];

export type CalendarEventItem = {
  id: string;
  title: string;
  description: string;
  eventType: string;
  startsAt: string;
  endsAt: string;
  allDay: boolean;
  location: string;
  clientId: string | null;
  memberIds: string[];
  color: string | null;
  status: CalendarEventStatus;
  notes: string;
  reminderAt: string | null;
};

export function mapCalendarEventRow(row: CalendarEventRow): CalendarEventItem {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    eventType: row.event_type,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    allDay: row.all_day,
    location: row.location ?? "",
    clientId: row.client_id,
    memberIds: row.member_ids ?? [],
    color: row.color,
    status: row.status as CalendarEventStatus,
    notes: row.notes ?? "",
    reminderAt: row.reminder_at,
  };
}
