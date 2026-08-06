import { describe, expect, it, vi } from "vitest";

import { calendarEventFormSchema, moveCalendarEventSchema } from "@/lib/validations/calendar";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    getAll: vi.fn(() => []),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
}));

vi.mock("@/lib/workspace/permissions", () => ({
  requireWorkspaceAction: vi.fn(async () => {
    throw new Error("not_used_in_import_test");
  }),
}));

vi.mock("@/lib/activity/log", () => ({
  logActivity: vi.fn(),
}));

describe("calendarEventFormSchema", () => {
  it("accepts a valid create payload", () => {
    const result = calendarEventFormSchema.safeParse({
      title: "Ședință foto cuplu",
      eventType: "meeting",
      startsAt: "2026-08-05T10:00:00.000Z",
      endsAt: "2026-08-05T11:00:00.000Z",
      allDay: false,
      status: "confirmed",
    });

    expect(result.success).toBe(true);
  });

  it("fills in defaults for optional fields", () => {
    const result = calendarEventFormSchema.safeParse({
      title: "Vizionare locație",
      startsAt: "2026-08-05T10:00:00.000Z",
      endsAt: "2026-08-05T11:00:00.000Z",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.eventType).toBe("event");
      expect(result.data.status).toBe("confirmed");
      expect(result.data.allDay).toBe(false);
      expect(result.data.memberIds).toEqual([]);
      expect(result.data.clientId).toBeNull();
    }
  });

  it("rejects an end before the start", () => {
    const result = calendarEventFormSchema.safeParse({
      title: "Ședință foto cuplu",
      startsAt: "2026-08-05T11:00:00.000Z",
      endsAt: "2026-08-05T10:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an empty title", () => {
    const result = calendarEventFormSchema.safeParse({
      title: "",
      startsAt: "2026-08-05T10:00:00.000Z",
      endsAt: "2026-08-05T11:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid client id", () => {
    const result = calendarEventFormSchema.safeParse({
      title: "Ședință foto cuplu",
      startsAt: "2026-08-05T10:00:00.000Z",
      endsAt: "2026-08-05T11:00:00.000Z",
      clientId: "not-a-uuid",
    });

    expect(result.success).toBe(false);
  });
});

describe("moveCalendarEventSchema", () => {
  it("accepts a valid move payload", () => {
    const result = moveCalendarEventSchema.safeParse({
      startsAt: "2026-08-05T10:00:00.000Z",
      endsAt: "2026-08-05T11:00:00.000Z",
    });

    expect(result.success).toBe(true);
  });

  it("rejects an end before the start", () => {
    const result = moveCalendarEventSchema.safeParse({
      startsAt: "2026-08-05T11:00:00.000Z",
      endsAt: "2026-08-05T10:00:00.000Z",
    });

    expect(result.success).toBe(false);
  });
});

describe("calendar server actions module", () => {
  it("can be imported without runtime reference errors", async () => {
    const calendarActions = await import("@/lib/actions/calendar");

    expect(calendarActions.createCalendarEventAction).toBeDefined();
    expect(calendarActions.updateCalendarEventAction).toBeDefined();
    expect(calendarActions.moveCalendarEventAction).toBeDefined();
    expect(calendarActions.deleteCalendarEventAction).toBeDefined();
  });
});
