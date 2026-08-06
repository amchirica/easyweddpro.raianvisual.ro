import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const pendingCookies: Array<{ name: string; value: string }> = [];

const verifyOtp = vi.fn();
const exchangeCodeForSession = vi.fn();
const getUser = vi.fn();
const rpc = vi.fn();
const from = vi.fn();

vi.mock("@/lib/env", () => ({
  hasSupabaseEnv: () => true,
  requireSupabasePublicEnv: () => ({
    url: "https://example.supabase.co",
    anonKey: "anon",
  }),
}));

vi.mock("@/lib/supabase/auth-route", () => ({
  createAuthRouteClient: () => ({
    auth: {
      verifyOtp,
      exchangeCodeForSession,
      getUser,
    },
    rpc,
    from,
  }),
  applyPendingAuthCookies: (response: Response) => {
    pendingCookies.forEach((cookie) => {
      response.headers.append("set-cookie", `${cookie.name}=${cookie.value}`);
    });
    return response;
  },
}));

describe("auth confirm route", () => {
  beforeEach(() => {
    vi.resetModules();
    pendingCookies.length = 0;
    verifyOtp.mockReset();
    getUser.mockReset();
    rpc.mockReset();
    from.mockReset();
    pendingCookies.push({ name: "sb-access-token", value: "session" });
  });

  it("redirects to onboarding when confirm succeeds without workspace", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    rpc.mockResolvedValue({ error: null });
    from.mockReturnValue({
      select: () => ({
        eq: () => ({
          limit: async () => ({ data: [] }),
        }),
      }),
    });

    const { GET } = await import("@/app/auth/confirm/route");
    const request = new NextRequest(
      "http://localhost:3000/auth/confirm?token_hash=abc&type=signup&next=/onboarding",
    );
    const response = await GET(request);

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("http://localhost:3000/onboarding");
    expect(response.headers.get("set-cookie")).toContain("sb-access-token=session");
  });

  it("redirects to dashboard when confirm succeeds with workspace", async () => {
    verifyOtp.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    rpc.mockResolvedValue({ error: null });
    from.mockReturnValue({
      select: () => ({
        eq: () => ({
          limit: async () => ({ data: [{ workspace_id: "w1" }] }),
        }),
      }),
    });

    const { GET } = await import("@/app/auth/confirm/route");
    const request = new NextRequest(
      "http://localhost:3000/auth/confirm?token_hash=abc&type=signup&next=/dashboard",
    );
    const response = await GET(request);

    expect(response.headers.get("location")).toBe("http://localhost:3000/dashboard");
  });
});

describe("auth callback route", () => {
  beforeEach(() => {
    vi.resetModules();
    pendingCookies.length = 0;
    exchangeCodeForSession.mockReset();
    getUser.mockReset();
    rpc.mockReset();
    from.mockReset();
    pendingCookies.push({ name: "sb-access-token", value: "session" });
  });

  it("redirects when code is missing", async () => {
    const { GET } = await import("@/app/auth/callback/route");
    const request = new NextRequest("http://localhost:3000/auth/callback");
    const response = await GET(request);
    expect(response.headers.get("location")).toContain("missing_auth_code");
  });

  it("redirects on session exchange error", async () => {
    exchangeCodeForSession.mockResolvedValue({
      error: { message: "bad", code: "invalid_grant" },
    });

    const { GET } = await import("@/app/auth/callback/route");
    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=bad&next=/dashboard",
    );
    const response = await GET(request);
    expect(response.headers.get("location")).toContain("session_initialization_failed");
  });

  it("redirects recovery session to reset-password with cookies", async () => {
    exchangeCodeForSession.mockResolvedValue({ error: null });
    getUser.mockResolvedValue({ data: { user: { id: "u1" } } });
    rpc.mockResolvedValue({ error: null });

    const { GET } = await import("@/app/auth/callback/route");
    const request = new NextRequest(
      "http://localhost:3000/auth/callback?code=ok&next=/auth/reset-password",
    );
    const response = await GET(request);

    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/auth/reset-password",
    );
    expect(response.headers.get("set-cookie")).toContain("sb-access-token=session");
  });
});
