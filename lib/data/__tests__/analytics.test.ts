import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { fetchWorkspaceAnalyticsSummary, mapAnalyticsSummary, toCurrencyMap } from "@/lib/data/analytics";

describe("toCurrencyMap", () => {
  it("normalizes a currency-keyed jsonb object", () => {
    expect(toCurrencyMap({ RON: 1000, EUR: "200.5" })).toEqual({ RON: 1000, EUR: 200.5 });
  });

  it("drops non-numeric entries and returns {} for invalid input", () => {
    expect(toCurrencyMap({ RON: "abc" })).toEqual({});
    expect(toCurrencyMap(null)).toEqual({});
    expect(toCurrencyMap([1, 2, 3])).toEqual({});
    expect(toCurrencyMap("not-an-object")).toEqual({});
  });
});

describe("mapAnalyticsSummary", () => {
  it("maps a full RPC payload into the typed summary", () => {
    const summary = mapAnalyticsSummary({
      leads_created: 5,
      leads_by_source: { Instagram: 3, Website: 2 },
      proposals_sent: 4,
      proposals_accepted: 2,
      contracts_created: 3,
      contracts_accepted: 1,
      contracted_by_currency: { RON: 15000 },
      collected_by_currency: { RON: 5000 },
      outstanding_by_currency: { RON: 10000 },
      active_projects: 2,
      overdue_tasks: 1,
      upcoming_events: 3,
    });

    expect(summary).toEqual({
      leadsCreated: 5,
      leadsBySource: { Instagram: 3, Website: 2 },
      proposalsSent: 4,
      proposalsAccepted: 2,
      contractsCreated: 3,
      contractsAccepted: 1,
      contractedByCurrency: { RON: 15000 },
      collectedByCurrency: { RON: 5000 },
      outstandingByCurrency: { RON: 10000 },
      activeProjects: 2,
      overdueTasks: 1,
      upcomingEvents: 3,
    });
  });

  it("defaults every field to zero/empty for null or empty payloads — never invents demo data", () => {
    expect(mapAnalyticsSummary(null)).toEqual({
      leadsCreated: 0,
      leadsBySource: {},
      proposalsSent: 0,
      proposalsAccepted: 0,
      contractsCreated: 0,
      contractsAccepted: 0,
      contractedByCurrency: {},
      collectedByCurrency: {},
      outstandingByCurrency: {},
      activeProjects: 0,
      overdueTasks: 0,
      upcomingEvents: 0,
    });
  });
});

describe("fetchWorkspaceAnalyticsSummary", () => {
  it("calls the workspace_analytics_summary RPC with the given range and maps the result", async () => {
    const rpc = vi.fn(async () => ({
      data: { leads_created: 7, contracted_by_currency: { RON: 100 } },
      error: null,
    }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = { rpc } as any;

    const summary = await fetchWorkspaceAnalyticsSummary(supabase, "ws_1", {
      from: "2026-01-01",
      to: "2026-01-31",
    });

    expect(rpc).toHaveBeenCalledWith("workspace_analytics_summary", {
      p_workspace_id: "ws_1",
      p_from: "2026-01-01",
      p_to: "2026-01-31",
    });
    expect(summary.leadsCreated).toBe(7);
    expect(summary.contractedByCurrency).toEqual({ RON: 100 });
  });

  it("throws when the RPC returns an error", async () => {
    const rpc = vi.fn(async () => ({ data: null, error: { message: "forbidden" } }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = { rpc } as any;

    await expect(fetchWorkspaceAnalyticsSummary(supabase, "ws_1")).rejects.toThrow("forbidden");
  });
});
