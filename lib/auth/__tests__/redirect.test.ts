import { describe, expect, it } from "vitest";

import { getSafeRedirectPath } from "@/lib/auth/redirect";

describe("getSafeRedirectPath", () => {
  it("accepts internal paths", () => {
    expect(getSafeRedirectPath("/onboarding")).toBe("/onboarding");
    expect(getSafeRedirectPath("/dashboard/leads")).toBe("/dashboard/leads");
  });

  it("rejects external and protocol-relative URLs", () => {
    expect(getSafeRedirectPath("https://evil.example")).toBe("/dashboard");
    expect(getSafeRedirectPath("//evil.example")).toBe("/dashboard");
    expect(getSafeRedirectPath(null, "/onboarding")).toBe("/onboarding");
  });

  it("rejects auth handler loops", () => {
    expect(getSafeRedirectPath("/auth/confirm")).toBe("/dashboard");
    expect(getSafeRedirectPath("/auth/callback?code=x")).toBe("/dashboard");
  });
});
