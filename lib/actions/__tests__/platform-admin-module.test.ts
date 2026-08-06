import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("platform-admin actions module", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../platform-admin.ts"),
    "utf8",
  );

  it("defines audited sensitive actions", () => {
    expect(source).toContain("export async function suspendUserAction");
    expect(source).toContain("export async function startInspectSessionAction");
    expect(source).toContain("export async function runCronNowAction");
    expect(source).toContain("writePlatformAudit");
    expect(source).toContain('requirePlatformPermission("cron.run")');
    expect(source).toContain("reason");
  });

  it("requires inspect reason of at least 10 characters", () => {
    expect(source).toContain("startInspectSessionAction");
    expect(source).toMatch(/reason:\s*z\.string\(\)[\s\S]*?\.min\(10\)/);
  });
});
