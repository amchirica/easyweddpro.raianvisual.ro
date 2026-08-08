import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const createNotification = vi.fn();
const notifyWorkspaceManagers = vi.fn();

vi.mock("@/lib/notifications/create", () => ({
  createNotification: (...args: unknown[]) => createNotification(...args),
  notifyWorkspaceManagers: (...args: unknown[]) => notifyWorkspaceManagers(...args),
}));

import { notifyEvent, notifyLeadCreated } from "@/lib/notifications/events";

describe("notifyEvent", () => {
  it("treats idempotency conflicts (create returns null on 23505) as success", async () => {
    createNotification.mockResolvedValueOnce(null);
    await expect(
      notifyEvent({
        supabase: {} as never,
        workspaceId: "ws-1",
        userId: "user-1",
        type: "lead_new",
        title: "Lead nou",
        idempotencyKey: "lead_new:lead-1",
      }),
    ).resolves.toBeUndefined();
    expect(createNotification).toHaveBeenCalledTimes(1);
  });
});

describe("notifyLeadCreated", () => {
  it("notifies managers with type lead_new and stable idempotency key", async () => {
    notifyWorkspaceManagers.mockResolvedValueOnce([]);
    await notifyLeadCreated({} as never, "ws-1", { id: "lead-99", name: "Ana" });
    expect(notifyWorkspaceManagers).toHaveBeenCalledWith(
      expect.anything(),
      "ws-1",
      expect.objectContaining({
        type: "lead_new",
        title: "Lead nou",
        body: "Ana",
        entityType: "lead",
        entityId: "lead-99",
        idempotencyKey: "lead_new:lead-99",
      }),
    );
  });
});
