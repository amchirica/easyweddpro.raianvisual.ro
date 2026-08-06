import { afterEach, describe, expect, it, vi } from "vitest";

describe("getAppUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it("uses NEXT_PUBLIC_APP_URL and strips trailing slash", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://easyweddpro.raianvisual.ro/");
    vi.stubEnv("NODE_ENV", "production");
    const { getAppUrl } = await import("@/lib/url");
    expect(getAppUrl()).toBe("https://easyweddpro.raianvisual.ro");
  });

  it("falls back to localhost in development when unset", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "development");
    const { getAppUrl } = await import("@/lib/url");
    expect(getAppUrl()).toBe("http://localhost:3000");
  });

  it("throws in production when URL is not configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    vi.stubEnv("NODE_ENV", "production");
    const { getAppUrl } = await import("@/lib/url");
    expect(() => getAppUrl()).toThrow(/not configured/i);
  });

  it("builds password reset redirect for local development", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "http://localhost:3000");
    vi.stubEnv("NODE_ENV", "development");
    const { getPasswordResetRedirectTo } = await import("@/lib/url");
    expect(getPasswordResetRedirectTo()).toBe(
      "http://localhost:3000/auth/callback?next=/auth/reset-password",
    );
  });

  it("builds password reset redirect for production", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://easyweddpro.raianvisual.ro");
    vi.stubEnv("NODE_ENV", "production");
    const { getPasswordResetRedirectTo } = await import("@/lib/url");
    expect(getPasswordResetRedirectTo()).toBe(
      "https://easyweddpro.raianvisual.ro/auth/callback?next=/auth/reset-password",
    );
  });

  it("does not use production URL for redirects while running locally", async () => {
    vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://easyweddpro.raianvisual.ro");
    vi.stubEnv("NODE_ENV", "development");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { getAppUrl, getPasswordResetRedirectTo } = await import("@/lib/url");
    expect(getAppUrl()).toBe("http://localhost:3000");
    expect(getPasswordResetRedirectTo()).toContain("http://localhost:3000");
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
