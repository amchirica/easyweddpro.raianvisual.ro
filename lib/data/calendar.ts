import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

export type CalendarEventRow = Database["public"]["Tables"]["calendar_events"]["Row"];

export type ListCalendarEventsOptions = {
  /** Inclusive lower bound on starts_at (ISO string). */
  rangeStart?: string;
  /** Inclusive upper bound on starts_at (ISO string). */
  rangeEnd?: string;
  search?: string;
  status?: string;
  eventType?: string;
  clientId?: string;
  projectId?: string;
  limit?: number;
};

export async function listCalendarEvents(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  options?: ListCalendarEventsOptions,
): Promise<CalendarEventRow[]> {
  const limit = Math.min(options?.limit ?? 500, 1000);

  let query = supabase
    .from("calendar_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .is("deleted_at", null)
    .order("starts_at", { ascending: true })
    .limit(limit);

  if (options?.rangeStart) {
    query = query.gte("starts_at", options.rangeStart);
  }
  if (options?.rangeEnd) {
    query = query.lte("starts_at", options.rangeEnd);
  }
  if (options?.status && options.status !== "all") {
    query = query.eq("status", options.status);
  }
  if (options?.eventType && options.eventType !== "all") {
    query = query.eq("event_type", options.eventType);
  }
  if (options?.clientId) {
    query = query.eq("client_id", options.clientId);
  }
  if (options?.projectId) {
    query = query.eq("project_id", options.projectId);
  }
  if (options?.search?.trim()) {
    const q = options.search.trim().replace(/[%_,]/g, "");
    if (q) {
      const pattern = `%${q}%`;
      query = query.or(
        `title.ilike."${pattern}",location.ilike."${pattern}",description.ilike."${pattern}"`,
      );
    }
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCalendarEventById(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  eventId: string,
): Promise<CalendarEventRow | null> {
  const { data, error } = await supabase
    .from("calendar_events")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", eventId)
    .is("deleted_at", null)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}
