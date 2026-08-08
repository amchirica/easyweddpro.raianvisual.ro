import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const MIGRATION = resolve(
  process.cwd(),
  "supabase/migrations/20260808120000_fix_platform_admins_rls_recursion.sql",
);

describe("platform_admins RLS migration (static)", () => {
  const sql = readFileSync(MIGRATION, "utf8");

  it("defines is_platform_admin_user as SECURITY DEFINER", () => {
    expect(sql).toMatch(/function public\.is_platform_admin_user\s*\(/i);
    expect(sql).toMatch(/is_platform_admin_user[\s\S]*?security definer/i);
  });

  it("defines is_platform_super_admin", () => {
    expect(sql).toMatch(/function public\.is_platform_super_admin\s*\(/i);
  });

  it("makes is_platform_admin delegate to is_platform_admin_user", () => {
    expect(sql).toMatch(
      /create or replace function public\.is_platform_admin\(\)[\s\S]*?is_platform_admin_user\(auth\.uid\(\)\)/i,
    );
  });

  it("does not nest from public.platform_admins inside platform_admins policy USING/WITH CHECK", () => {
    const policyBlocks = [...sql.matchAll(/create policy\s+"([^"]+)"([\s\S]*?)(?=create policy|comment on|$)/gi)];
    const platformAdminPolicies = policyBlocks.filter(([, name]) =>
      String(name).startsWith("platform_admins_"),
    );
    expect(platformAdminPolicies.length).toBeGreaterThan(0);

    for (const [, name, body] of platformAdminPolicies) {
      const usingOrCheck = body.match(/(?:using|with check)\s*\(([\s\S]*?)\)\s*;/gi) ?? [];
      for (const clause of usingOrCheck) {
        expect(clause, `policy ${name} must not query platform_admins directly`).not.toMatch(
          /from\s+public\.platform_admins/i,
        );
      }
      if (String(name).includes("_super") || /insert|update|delete/i.test(String(name))) {
        expect(body).toMatch(/is_platform_super_admin\(\)/);
      }
    }
  });
});
