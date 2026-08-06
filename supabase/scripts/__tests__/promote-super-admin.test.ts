import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("promote_andrei_to_super_admin.sql", () => {
  const source = readFileSync(
    path.resolve(__dirname, "../promote_andrei_to_super_admin.sql"),
    "utf8",
  );

  it("requires existing auth.users lookup by email", () => {
    expect(source).toContain(
      "Acest script trebuie rulat numai după ce utilizatorul există în Authentication → Users.",
    );
    expect(source).toContain("andreim.chirica@gmail.com");
    expect(source).toContain("from auth.users");
    expect(source).toContain("raise exception");
  });

  it("is idempotent and uses platform_super_admin", () => {
    expect(source).toContain("platform_super_admin");
    expect(source).toContain("on conflict (user_id) do update");
    expect(source).toContain("on conflict (id) do update");
    expect(source).toContain("disabled_at = null");
    expect(source).toContain("platform_audit_logs");
  });
});
