import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { mapWorkspaceSubscriptionForAdmin } from "@/lib/data/admin";
import type { Database } from "@/types/database";

type SubscriptionRow = Database["public"]["Tables"]["subscriptions"]["Row"];

function sub(overrides: Partial<SubscriptionRow> & Pick<SubscriptionRow, "id" | "workspace_id" | "plan" | "status">): SubscriptionRow {
  return {
    stripe_customer_id: null,
    stripe_subscription_id: null,
    stripe_price_id: null,
    trial_ends_at: null,
    current_period_start: null,
    current_period_end: null,
    cancel_at_period_end: false,
    trial_end: null,
    billing_interval: null,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("mapWorkspaceSubscriptionForAdmin", () => {
  it("labels Free when subscription is null", () => {
    const mapped = mapWorkspaceSubscriptionForAdmin(
      { id: "ws-1", name: "Studio Ana", plan: "studio" },
      null,
    );
    expect(mapped.plan).toBe("free");
    expect(mapped.status).toBe("inactive");
    expect(mapped.amount).toBe(0);
    expect(mapped.workspaceId).toBe("ws-1");
    expect(mapped.workspaceName).toBe("Studio Ana");
    expect(mapped.id).toBe("free:ws-1");
    expect(mapped.isFreeFallback).toBe(true);
  });

  it("maps an active paid subscription", () => {
    const mapped = mapWorkspaceSubscriptionForAdmin(
      { id: "ws-2", name: "Agency X" },
      sub({
        id: "sub-1",
        workspace_id: "ws-2",
        plan: "agency",
        status: "active",
        current_period_end: "2026-09-01T00:00:00Z",
        billing_interval: "month",
        stripe_customer_id: "cus_x",
        stripe_subscription_id: "sub_x",
      }),
    );
    expect(mapped.plan).toBe("agency");
    expect(mapped.status).toBe("active");
    expect(mapped.amount).toBe(349);
    expect(mapped.id).toBe("sub-1");
    expect(mapped.isFreeFallback).toBe(false);
    expect(mapped.stripeCustomerId).toBe("cus_x");
  });
});
