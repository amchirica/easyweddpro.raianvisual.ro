import { describe, expect, it, vi } from "vitest";

import { settleJobs } from "@/lib/background/runner";
import type { JobResult } from "@/lib/background/types";
import { EVENT_REMINDER_DAYS } from "@/lib/background/types";
import { addDaysDateString, todayDateString } from "@/lib/background/client";

vi.stubGlobal("console", { ...console, error: vi.fn(), log: vi.fn() });

describe("runBackgroundJobs modules", () => {
  it("settleJobs keeps running after a rejection", async () => {
    const results = await settleJobs([
      async () =>
        ({
          job: "a",
          success: true,
          processed: 1,
          errors: 0,
          durationMs: 1,
        }) satisfies JobResult,
      async () => {
        throw new Error("fail-b");
      },
    ]);
    expect(results[0]?.success).toBe(true);
    expect(results[1]?.success).toBe(false);
    expect(results[1]?.errorMessages).toContain("fail-b");
  });

  it("defines event reminder windows", () => {
    expect(EVENT_REMINDER_DAYS).toEqual([30, 14, 7, 3, 1]);
    const today = todayDateString();
    expect(addDaysDateString(today, 1) > today).toBe(true);
  });
});

describe("cron log", () => {
  it("starts and finishes a run", async () => {
    const updates: unknown[] = [];
    const supabase = {
      from() {
        return {
          insert: () => ({
            select: () => ({
              single: async () => ({ data: { id: "cron-1" }, error: null }),
            }),
          }),
          update: (payload: unknown) => {
            updates.push(payload);
            return { eq: async () => ({ error: null }) };
          },
        };
      },
    };

    const { startCronRun, finishCronRun } = await import("@/lib/background/cron-log");
    const id = await startCronRun(supabase as never, "payments", { source: "test" });
    expect(id).toBe("cron-1");
    await finishCronRun(supabase as never, id, {
      success: true,
      processed: 5,
      errors: 0,
      durationMs: 9,
    });
    expect(updates[0]).toMatchObject({ success: true, processed: 5, duration_ms: 9 });
  });
});

describe("notification idempotency", () => {
  it("returns 0 inserts on unique violation", async () => {
    const { notifyManagersIdempotent } = await import("@/lib/background/notify");
    const supabase = {
      from(table: string) {
        if (table === "workspace_members") {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  is: async () => ({ data: [{ user_id: "u1" }], error: null }),
                }),
              }),
            }),
          };
        }
        return {
          insert: async () => ({ error: { code: "23505", message: "duplicate" } }),
        };
      },
    };

    const inserted = await notifyManagersIdempotent(supabase as never, "ws", {
      type: "task_overdue",
      title: "x",
      idempotencyKey: "task_overdue:t1:2026-08-06",
    });
    expect(inserted).toBe(0);
  });
});

describe("overdue payments scanner", () => {
  it("notifies managers for overdue rows", async () => {
    const { processOverduePayments } = await import("@/lib/background/payments");
    const inserts: Array<{ idempotency_key: string }> = [];
    const supabase = {
      from(table: string) {
        if (table === "payments") {
          return {
            select: () => ({
              in: () => ({
                is: () => ({
                  not: () => ({
                    order: () => ({
                      range: async () => ({
                        data: [
                          {
                            id: "pay-1",
                            workspace_id: "ws-1",
                            label: "Avans",
                            amount: 1000,
                            currency: "RON",
                            due_date: "2020-01-01",
                            status: "pending",
                          },
                        ],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }),
            }),
          };
        }
        if (table === "workspace_members") {
          return {
            select: () => ({
              eq: () => ({
                in: () => ({
                  is: async () => ({ data: [{ user_id: "owner-1" }], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === "notifications") {
          return {
            insert: async (row: { idempotency_key: string }) => {
              inserts.push(row);
              return { error: null };
            },
          };
        }
        throw new Error(table);
      },
    };

    const result = await processOverduePayments(supabase as never, {
      batchSize: 10,
      maxPages: 1,
    });
    expect(result.processed).toBe(1);
    expect(inserts[0]?.idempotency_key).toContain("payment_overdue:pay-1");
  });
});

describe("module surface", () => {
  it("loads cleanup / analytics / emails / events / tasks / automations", async () => {
    const modules = await Promise.all([
      import("@/lib/background/cleanup"),
      import("@/lib/background/analytics"),
      import("@/lib/background/emails"),
      import("@/lib/background/events"),
      import("@/lib/background/tasks"),
      import("@/lib/background/automations"),
      import("@/lib/background/notifications"),
    ]);
    expect(modules.every(Boolean)).toBe(true);
  });
});
