import "server-only";

import { forbidden } from "next/navigation";

import { logAdminAccess } from "@/lib/platform/audit";
import {
  canPerformPlatformAction,
  type PlatformAction,
} from "@/lib/platform/permissions";
import { isPlatformRole, type PlatformRole } from "@/lib/platform/roles";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/workspace/session";

export type PlatformAdminContext = Awaited<ReturnType<typeof requireUser>> & {
  platformRole: PlatformRole;
};

export async function getPlatformAdminRole(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  userId: string,
): Promise<PlatformRole | null> {
  const { data } = await supabase
    .from("platform_admins")
    .select("role, disabled_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (data && !data.disabled_at && isPlatformRole(data.role)) {
    return data.role;
  }

  // Legacy fallback while migration backfill settles
  const { data: profile } = await supabase
    .from("profiles")
    .select("is_platform_admin")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.is_platform_admin) return "platform_super_admin";
  return null;
}

/**
 * Require a platform permission. Returns 403 (forbidden) — never redirects to dashboard.
 */
export async function requirePlatformPermission(
  action: PlatformAction = "admin.access",
): Promise<PlatformAdminContext> {
  const ctx = await requireUser();
  const role = await getPlatformAdminRole(ctx.supabase, ctx.user.id);

  if (!role || !canPerformPlatformAction(role, action)) {
    await logAdminAccess(ctx.supabase, {
      userId: ctx.user.id,
      path: action,
      outcome: "forbidden",
      metadata: { role: role ?? null, action },
    });
    forbidden();
  }

  return { ...ctx, platformRole: role, isPlatformAdmin: true };
}

/** Soft check used by layout nav filtering. */
export async function getPlatformAdminContext(): Promise<PlatformAdminContext | null> {
  try {
    const ctx = await requireUser();
    const role = await getPlatformAdminRole(ctx.supabase, ctx.user.id);
    if (!role || !canPerformPlatformAction(role, "admin.access")) return null;
    return { ...ctx, platformRole: role, isPlatformAdmin: true };
  } catch {
    return null;
  }
}

export { canPerformPlatformAction };
