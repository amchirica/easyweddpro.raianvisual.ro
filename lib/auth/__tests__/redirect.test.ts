import { describe, expect, it, vi } from "vitest";

import { getSafeRedirectPath, resolvePostAuthPath } from "@/lib/auth/redirect";

describe("getSafeRedirectPath", () => {
  it("accepts internal paths", () => {
    expect(getSafeRedirectPath("/onboarding")).toBe("/onboarding");
    expect(getSafeRedirectPath("/dashboard/leads")).toBe("/dashboard/leads");
    expect(getSafeRedirectPath("/auth/reset-password")).toBe("/auth/reset-password");
  });

  it("rejects external and protocol-relative URLs", () => {
    expect(getSafeRedirectPath("https://evil.example")).toBeNull();
    expect(getSafeRedirectPath("//evil.example")).toBeNull();
    expect(getSafeRedirectPath("javascript:alert(1)")).toBeNull();
    expect(getSafeRedirectPath(null)).toBeNull();
    expect(getSafeRedirectPath(null, "/onboarding")).toBe("/onboarding");
  });

  it("rejects auth handler loops but allows reset-password", () => {
    expect(getSafeRedirectPath("/auth/confirm")).toBeNull();
    expect(getSafeRedirectPath("/auth/callback")).toBeNull();
    expect(getSafeRedirectPath("/auth/reset-password", "/dashboard")).toBe(
      "/auth/reset-password",
    );
  });
});

describe("resolvePostAuthPath", () => {
  it("sends users without workspace to onboarding", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(async () => ({ data: [] })),
          })),
        })),
      })),
    };

    await expect(
      resolvePostAuthPath(supabase as never, "/dashboard"),
    ).resolves.toBe("/onboarding");
  });

  it("sends users with workspace to dashboard", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(async () => ({ data: [{ workspace_id: "w1" }] })),
          })),
        })),
      })),
    };

    await expect(
      resolvePostAuthPath(supabase as never, "/onboarding"),
    ).resolves.toBe("/dashboard");
  });

  it("keeps recovery destination on reset-password", async () => {
    const supabase = {
      auth: {
        getUser: vi.fn(async () => ({ data: { user: { id: "u1" } } })),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            limit: vi.fn(async () => ({ data: [{ workspace_id: "w1" }] })),
          })),
        })),
      })),
    };

    await expect(
      resolvePostAuthPath(supabase as never, "/auth/reset-password"),
    ).resolves.toBe("/auth/reset-password");
  });
});
