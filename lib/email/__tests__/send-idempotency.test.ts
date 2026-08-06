import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const resendMocks = vi.hoisted(() => ({
  isResendConfigured: vi.fn(() => false),
  sendTransactionalEmail: vi.fn(async () => ({ providerMessageId: "msg_1" })),
}));

vi.mock("@/lib/email/resend", () => resendMocks);

import { sendWorkspaceEmail } from "@/lib/email/send";

type QueryResult = { data: unknown; error: { code?: string; message: string } | null };

function chain(result: QueryResult) {
  const builder: Record<string, unknown> = {
    eq: () => builder,
    select: () => builder,
    insert: (payload: unknown) => {
      (builder as { _insertPayload?: unknown })._insertPayload = payload;
      return builder;
    },
    update: (payload: unknown) => {
      (builder as { _updatePayload?: unknown })._updatePayload = payload;
      return builder;
    },
    single: () => Promise.resolve(result),
    maybeSingle: () => Promise.resolve(result),
    then: (resolve: (value: QueryResult) => unknown, reject?: (reason: unknown) => unknown) =>
      Promise.resolve(result).then(resolve, reject),
  };
  return builder;
}

type FakeSupabaseOptions = {
  existingLookup?: QueryResult;
  insertResult?: QueryResult;
  updateResult?: QueryResult;
};

function createFakeSupabase(options: FakeSupabaseOptions) {
  const inserts: Array<{ table: string; payload: unknown }> = [];
  const updates: Array<{ table: string; payload: unknown }> = [];
  let selectCallCount = 0;

  return {
    _inserts: inserts,
    _updates: updates,
    from(table: string) {
      return {
        select: () => {
          selectCallCount += 1;
          return chain(options.existingLookup ?? { data: null, error: null });
        },
        insert: (payload: unknown) => {
          inserts.push({ table, payload });
          return chain(options.insertResult ?? { data: { id: "delivery_1" }, error: null });
        },
        update: (payload: unknown) => {
          updates.push({ table, payload });
          return chain(options.updateResult ?? { data: null, error: null });
        },
      };
    },
    get _selectCallCount() {
      return selectCallCount;
    },
  };
}

const baseInput = {
  workspaceId: "ws_1",
  to: "client@example.com",
  template: "invitation",
  subject: "Bun venit",
  html: "<p>Bun venit</p>",
  idempotencyKey: "invitation:inv_1",
};

describe("sendWorkspaceEmail idempotency", () => {
  beforeEach(() => {
    resendMocks.isResendConfigured.mockReset().mockReturnValue(false);
    resendMocks.sendTransactionalEmail.mockReset().mockResolvedValue({ providerMessageId: "msg_1" });
  });

  it("short-circuits when a delivery with the same idempotency key already exists", async () => {
    const supabase = createFakeSupabase({
      existingLookup: {
        data: { id: "delivery_existing", status: "sent", provider_message_id: "msg_existing" },
        error: null,
      },
    });

    const result = await sendWorkspaceEmail({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      ...baseInput,
    });

    expect(result).toEqual({
      status: "sent",
      deliveryId: "delivery_existing",
      providerMessageId: "msg_existing",
    });
    expect(supabase._inserts).toHaveLength(0);
    expect(resendMocks.sendTransactionalEmail).not.toHaveBeenCalled();
  });

  it("marks the delivery as skipped when Resend is not configured, without claiming a send", async () => {
    resendMocks.isResendConfigured.mockReturnValue(false);
    const supabase = createFakeSupabase({});

    const result = await sendWorkspaceEmail({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      ...baseInput,
    });

    expect(result.status).toBe("skipped");
    expect(resendMocks.sendTransactionalEmail).not.toHaveBeenCalled();
    const skipUpdate = supabase._updates.find((u) => u.table === "email_deliveries");
    expect(skipUpdate?.payload).toMatchObject({ status: "skipped" });
  });

  it("marks the delivery as sent with the provider message id when Resend succeeds", async () => {
    resendMocks.isResendConfigured.mockReturnValue(true);
    resendMocks.sendTransactionalEmail.mockResolvedValue({ providerMessageId: "msg_abc" });
    const supabase = createFakeSupabase({});

    const result = await sendWorkspaceEmail({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      ...baseInput,
    });

    expect(result.status).toBe("sent");
    expect(result.providerMessageId).toBe("msg_abc");
    const sentUpdate = supabase._updates.find((u) => u.table === "email_deliveries");
    expect(sentUpdate?.payload).toMatchObject({ status: "sent", provider_message_id: "msg_abc" });
  });

  it("marks the delivery as failed when Resend throws, without throwing itself", async () => {
    resendMocks.isResendConfigured.mockReturnValue(true);
    resendMocks.sendTransactionalEmail.mockRejectedValue(new Error("resend_send_failed"));
    const supabase = createFakeSupabase({});

    const result = await sendWorkspaceEmail({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      supabase: supabase as any,
      ...baseInput,
    });

    expect(result.status).toBe("failed");
    expect(result.error).toBe("resend_send_failed");
    const failUpdate = supabase._updates.find((u) => u.table === "email_deliveries");
    expect(failUpdate?.payload).toMatchObject({ status: "failed", error_message: "resend_send_failed" });
  });
});
