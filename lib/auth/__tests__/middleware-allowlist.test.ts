import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("auth middleware allowlist", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../../supabase/middleware.ts"),
    "utf8",
  );

  it("always allows confirm, callback, signout, reset-password, forgot-password, check-email", () => {
    expect(source).toContain('"/auth/confirm"');
    expect(source).toContain('"/auth/callback"');
    expect(source).toContain('"/auth/signout"');
    expect(source).toContain('"/auth/reset-password"');
    expect(source).toContain('"/forgot-password"');
    expect(source).toContain('"/check-email"');
  });

  it("uses request-relative redirects for protected routes", () => {
    expect(source).toContain("request.nextUrl.clone()");
    expect(source).toContain('"/onboarding"');
    expect(source).toContain('"/dashboard"');
  });
});
