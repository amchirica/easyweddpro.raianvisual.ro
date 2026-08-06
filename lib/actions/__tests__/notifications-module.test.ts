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

vi.mock("@/lib/workspace/session", () => ({
  requireWorkspace: vi.fn(async () => {
    throw new Error("not_used_in_import_test");
  }),
}));

describe("notifications server actions module", () => {
  it("can be imported without runtime reference errors", async () => {
    const notificationsActions = await import("@/lib/actions/notifications");

    expect(notificationsActions.listUnreadCountAction).toBeDefined();
    expect(notificationsActions.listNotificationsAction).toBeDefined();
    expect(notificationsActions.markNotificationReadAction).toBeDefined();
    expect(notificationsActions.markAllNotificationsReadAction).toBeDefined();
  });

  it("rejects an invalid notification id before touching the session", async () => {
    const notificationsActions = await import("@/lib/actions/notifications");
    const result = await notificationsActions.markNotificationReadAction({ notificationId: "not-a-uuid" });
    expect(result.error).toBeTruthy();
  });
});
