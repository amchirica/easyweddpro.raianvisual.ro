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

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
}));

vi.mock("@/lib/workspace/session", () => ({
  requireWorkspace: vi.fn(async () => {
    throw new Error("not_used_in_import_test");
  }),
}));

describe("feedback server actions module", () => {
  it("can be imported without runtime reference errors", async () => {
    const feedbackActions = await import("@/lib/actions/feedback");
    expect(feedbackActions.submitFeedbackAction).toBeDefined();
  });

  it("rejects an empty message before touching the session", async () => {
    const feedbackActions = await import("@/lib/actions/feedback");
    const result = await feedbackActions.submitFeedbackAction({ type: "bug", message: "" });
    expect(result.error).toBeTruthy();
  });

  it("rejects an unknown feedback type before touching the session", async () => {
    const feedbackActions = await import("@/lib/actions/feedback");
    const result = await feedbackActions.submitFeedbackAction({
      type: "not_a_type",
      message: "Mesaj suficient de lung",
    });
    expect(result.error).toBeTruthy();
  });
});
