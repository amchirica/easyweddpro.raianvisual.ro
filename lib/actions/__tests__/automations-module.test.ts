import { describe, expect, it, vi } from "vitest";

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

describe("automations server actions module", () => {
  it("can be imported without runtime reference errors", async () => {
    const actions = await import("@/lib/actions/automations");
    expect(actions.createAutomationAction).toBeDefined();
    expect(actions.updateAutomationAction).toBeDefined();
    expect(actions.toggleAutomationAction).toBeDefined();
    expect(actions.duplicateAutomationAction).toBeDefined();
    expect(actions.deleteAutomationAction).toBeDefined();
  });

  it("rejects invalid input before touching the database", async () => {
    const actions = await import("@/lib/actions/automations");
    const result = await actions.createAutomationAction({ name: "" });
    expect(result.error).toBeTruthy();
  });
});

describe("automations data module", () => {
  it("can be imported without runtime reference errors", async () => {
    const data = await import("@/lib/data/automations");
    expect(data.listAutomations).toBeDefined();
    expect(data.getAutomationById).toBeDefined();
    expect(data.listAutomationRuns).toBeDefined();
    expect(data.countAutomationRunOutcomes).toBeDefined();
  });
});
