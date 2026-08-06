import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { runAutomationsForTrigger } from "@/lib/automations/engine";

type QueryResult = { data: unknown; error: { code?: string; message: string } | null };

function chain(result: QueryResult) {
  const builder: Record<string, unknown> = {
    eq: () => builder,
    is: () => builder,
    select: () => builder,
    single: () => builder,
    then: (resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

function createFakeSupabase(options: {
  automations: Array<Record<string, unknown>>;
  automationRunInsertResults: QueryResult[];
}) {
  let insertCallIndex = 0;
  const inserts: Array<{ table: string; payload: unknown }> = [];
  const updates: Array<{ table: string; payload: unknown }> = [];

  return {
    _inserts: inserts,
    _updates: updates,
    from(table: string) {
      return {
        select: () => chain({ data: options.automations, error: null }),
        insert: (payload: unknown) => {
          inserts.push({ table, payload });
          if (table === "automation_runs") {
            const result = options.automationRunInsertResults[insertCallIndex] ?? {
              data: null,
              error: null,
            };
            insertCallIndex += 1;
            return chain(result);
          }
          return chain({ data: null, error: null });
        },
        update: (payload: unknown) => {
          updates.push({ table, payload });
          return chain({ data: null, error: null });
        },
      };
    },
  };
}

const baseAutomation = {
  id: "auto_1",
  workspace_id: "ws_1",
  name: "Test automation",
  trigger_key: "lead_created",
  enabled: true,
  conditions: [],
  actions: [{ type: "log_activity", title: "Lead nou înregistrat" }],
  deleted_at: null,
};

describe("runAutomationsForTrigger idempotency", () => {
  it("runs an automation once and marks the run successful", async () => {
    const supabase = createFakeSupabase({
      automations: [baseAutomation],
      automationRunInsertResults: [{ data: { id: "run_1" }, error: null }],
    });

    const summaries = await runAutomationsForTrigger({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      workspaceId: "ws_1",
      triggerKey: "lead_created",
      entityId: "lead_1",
      idempotencyKey: "lead_created:lead_1",
    });

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({ automationId: "auto_1", status: "success" });
  });

  it("skips a duplicate run for the same idempotency key (unique violation)", async () => {
    const supabase = createFakeSupabase({
      automations: [baseAutomation],
      automationRunInsertResults: [
        { data: null, error: { code: "23505", message: "duplicate key value" } },
      ],
    });

    const summaries = await runAutomationsForTrigger({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      workspaceId: "ws_1",
      triggerKey: "lead_created",
      entityId: "lead_1",
      idempotencyKey: "lead_created:lead_1",
    });

    expect(summaries).toHaveLength(1);
    expect(summaries[0]).toMatchObject({ automationId: "auto_1", status: "skipped" });
    // Only the automation_runs insert should have happened — no activity_logs insert for a skipped run.
    expect(supabase._inserts.some((entry) => entry.table === "activity_logs")).toBe(false);
  });

  it("skips automations whose conditions do not match", async () => {
    const supabase = createFakeSupabase({
      automations: [
        {
          ...baseAutomation,
          conditions: [{ field: "source", operator: "eq", value: "Website" }],
        },
      ],
      automationRunInsertResults: [{ data: { id: "run_2" }, error: null }],
    });

    const summaries = await runAutomationsForTrigger({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      workspaceId: "ws_1",
      triggerKey: "lead_created",
      entityId: "lead_1",
      metadata: { source: "Instagram" },
      idempotencyKey: "lead_created:lead_1",
    });

    expect(summaries).toHaveLength(1);
    expect(summaries[0].status).toBe("skipped");
    expect(supabase._inserts.some((entry) => entry.table === "automation_runs")).toBe(false);
  });

  it("returns no summaries when there are no matching automations", async () => {
    const supabase = createFakeSupabase({ automations: [], automationRunInsertResults: [] });

    const summaries = await runAutomationsForTrigger({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      workspaceId: "ws_1",
      triggerKey: "contract_published",
      idempotencyKey: "contract_published:c1",
    });

    expect(summaries).toHaveLength(0);
  });
});
