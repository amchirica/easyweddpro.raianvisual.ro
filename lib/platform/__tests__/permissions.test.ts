import { describe, expect, it } from "vitest";

import {
  canPerformPlatformAction,
  permissionsForPlatformRole,
} from "@/lib/platform/permissions";

describe("platform permissions", () => {
  it("grants super admin full access", () => {
    expect(canPerformPlatformAction("platform_super_admin", "admins.write")).toBe(true);
    expect(canPerformPlatformAction("platform_super_admin", "cron.run")).toBe(true);
    expect(canPerformPlatformAction("platform_super_admin", "subscriptions.write")).toBe(true);
    expect(canPerformPlatformAction("platform_super_admin", "settings.write")).toBe(true);
  });

  it("denies normal roles from admin management actions", () => {
    expect(canPerformPlatformAction("platform_support", "admins.write")).toBe(false);
    expect(canPerformPlatformAction("platform_billing", "admins.write")).toBe(false);
    expect(canPerformPlatformAction("platform_developer", "admins.write")).toBe(false);
    expect(canPerformPlatformAction("platform_content", "admins.write")).toBe(false);
    expect(canPerformPlatformAction("platform_admin", "admins.write")).toBe(false);
  });

  it("blocks support from billing writes and admin management", () => {
    expect(canPerformPlatformAction("platform_support", "subscriptions.write")).toBe(false);
    expect(canPerformPlatformAction("platform_support", "admins.write")).toBe(false);
    expect(canPerformPlatformAction("platform_support", "users.read")).toBe(true);
    expect(canPerformPlatformAction("platform_support", "workspaces.inspect")).toBe(true);
  });

  it("allows billing role plan writes but not user writes", () => {
    expect(canPerformPlatformAction("platform_billing", "plans.write")).toBe(true);
    expect(canPerformPlatformAction("platform_billing", "users.write")).toBe(false);
  });

  it("allows developer cron run without users.write", () => {
    expect(canPerformPlatformAction("platform_developer", "cron.run")).toBe(true);
    expect(canPerformPlatformAction("platform_developer", "users.write")).toBe(false);
  });

  it("returns empty for null role", () => {
    expect(canPerformPlatformAction(null, "admin.access")).toBe(false);
    expect(permissionsForPlatformRole("platform_content").has("content.write")).toBe(true);
  });
});
