import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  canCreateResource,
  canUseFeature,
  getPlanLimits,
  normalizePlanId,
  type WorkspaceUsage,
} from "@/lib/billing/plans";

function usage(overrides: Partial<WorkspaceUsage> = {}): WorkspaceUsage {
  return {
    activeLeads: 0,
    clients: 0,
    users: 1,
    activeProposals: 0,
    activeContracts: 0,
    plan: "free",
    status: "trialing",
    ...overrides,
  };
}

describe("normalizePlanId", () => {
  it("passes through known plan ids", () => {
    expect(normalizePlanId("free")).toBe("free");
    expect(normalizePlanId("solo")).toBe("solo");
    expect(normalizePlanId("studio")).toBe("studio");
    expect(normalizePlanId("agency")).toBe("agency");
  });

  it("falls back to free for unknown, empty, or missing values", () => {
    expect(normalizePlanId("enterprise")).toBe("free");
    expect(normalizePlanId("")).toBe("free");
    expect(normalizePlanId(null)).toBe("free");
    expect(normalizePlanId(undefined)).toBe("free");
  });
});

describe("getPlanLimits", () => {
  it("caps the free plan on leads, clients, proposals and contracts", () => {
    const limits = getPlanLimits("free");
    expect(limits.activeLeads).toBe(5);
    expect(limits.clients).toBe(3);
    expect(limits.users).toBe(1);
    expect(limits.activeProposals).toBe(2);
    expect(limits.activeContracts).toBe(1);
  });

  it("lifts lead/client/proposal/contract caps on paid plans", () => {
    for (const plan of ["solo", "studio", "agency"] as const) {
      const limits = getPlanLimits(plan);
      expect(limits.activeLeads).toBeNull();
      expect(limits.clients).toBeNull();
      expect(limits.activeProposals).toBeNull();
      expect(limits.activeContracts).toBeNull();
    }
  });

  it("increases user seats by plan tier", () => {
    expect(getPlanLimits("free").users).toBe(1);
    expect(getPlanLimits("solo").users).toBe(1);
    expect(getPlanLimits("studio").users).toBe(5);
    expect(getPlanLimits("agency").users).toBe(15);
  });
});

describe("canUseFeature", () => {
  it("gates automations/analytics/branding behind Studio+", () => {
    expect(canUseFeature("free", "automations")).toBe(false);
    expect(canUseFeature("solo", "automations")).toBe(false);
    expect(canUseFeature("studio", "automations")).toBe(true);
    expect(canUseFeature("agency", "automations")).toBe(true);
  });

  it("gates multi-brand behind Agency only", () => {
    expect(canUseFeature("studio", "multiBrand")).toBe(false);
    expect(canUseFeature("agency", "multiBrand")).toBe(true);
  });
});

describe("canCreateResource", () => {
  it("allows creation while strictly under the plan limit", () => {
    const result = canCreateResource("free", "lead", usage({ activeLeads: 4 }));
    expect(result.ok).toBe(true);
  });

  it("blocks creation once the free plan lead limit is reached", () => {
    const result = canCreateResource("free", "lead", usage({ activeLeads: 5 }));
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.limit).toBe(5);
      expect(result.reason).toContain("Free");
      expect(result.reason).toContain("upgrade");
    }
  });

  it("blocks creation once the free plan client limit is reached", () => {
    const result = canCreateResource("free", "client", usage({ clients: 3 }));
    expect(result.ok).toBe(false);
  });

  it("blocks adding a user once the plan seat limit is reached", () => {
    const result = canCreateResource("studio", "user", usage({ users: 5 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.limit).toBe(5);
  });

  it("never blocks unlimited resources on paid plans", () => {
    expect(canCreateResource("agency", "lead", usage({ activeLeads: 10_000 })).ok).toBe(true);
    expect(canCreateResource("agency", "client", usage({ clients: 10_000 })).ok).toBe(true);
  });

  it("blocks free plan proposals/contracts at their caps", () => {
    expect(canCreateResource("free", "proposal", usage({ activeProposals: 2 })).ok).toBe(false);
    expect(canCreateResource("free", "contract", usage({ activeContracts: 1 })).ok).toBe(false);
  });
});
