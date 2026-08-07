import "server-only";

import { PLAN_CATALOG } from "@/lib/billing/plan-catalog";
import {
  listSubscriptionsForAdmin,
  listUsersForAdmin,
  listWorkspacesForAdmin,
} from "@/lib/data/admin";
import {
  canPerformPlatformAction,
  type PlatformAction,
} from "@/lib/platform/permissions";
import type { PlatformRole } from "@/lib/platform/roles";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type PlatformSearchHit = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  group: PlatformSearchGroupKey;
};

export type PlatformSearchGroupKey = "users" | "workspaces" | "subscriptions" | "plans";

export type PlatformSearchGroup = {
  key: PlatformSearchGroupKey;
  items: PlatformSearchHit[];
};

const LIMIT = 5;

const GROUP_PERMISSION: Record<PlatformSearchGroupKey, PlatformAction> = {
  users: "users.read",
  workspaces: "workspaces.read",
  subscriptions: "subscriptions.read",
  plans: "plans.read",
};

function match(hay: string | null | undefined, q: string): boolean {
  return (hay ?? "").toLowerCase().includes(q);
}

export async function searchPlatform(
  supabase: SupabaseClient<Database>,
  query: string,
  platformRole: PlatformRole,
): Promise<PlatformSearchGroup[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const canUsers = canPerformPlatformAction(platformRole, GROUP_PERMISSION.users);
  const canWorkspaces = canPerformPlatformAction(platformRole, GROUP_PERMISSION.workspaces);
  const canSubs = canPerformPlatformAction(platformRole, GROUP_PERMISSION.subscriptions);
  const canPlans = canPerformPlatformAction(platformRole, GROUP_PERMISSION.plans);

  if (!canUsers && !canWorkspaces && !canSubs && !canPlans) {
    return [];
  }

  const [users, workspaces, subscriptions] = await Promise.all([
    canUsers ? listUsersForAdmin(supabase, 200) : Promise.resolve([]),
    canWorkspaces || canSubs
      ? listWorkspacesForAdmin(supabase, 200)
      : Promise.resolve([]),
    canSubs || canPlans ? listSubscriptionsForAdmin(supabase, 200) : Promise.resolve([]),
  ]);

  const groups: PlatformSearchGroup[] = [];

  if (canUsers) {
    groups.push({
      key: "users",
      items: users
        .filter((u) => match(u.fullName, q) || match(u.email, q))
        .slice(0, LIMIT)
        .map((u) => ({
          id: u.id,
          title: u.fullName || u.email || u.id.slice(0, 8),
          subtitle: u.email ?? undefined,
          href: `/admin/users/${u.id}`,
          group: "users" as const,
        })),
    });
  }

  if (canWorkspaces) {
    groups.push({
      key: "workspaces",
      items: workspaces
        .filter((w) => match(w.name, q) || match(w.slug, q) || match(w.city, q))
        .slice(0, LIMIT)
        .map((w) => ({
          id: w.id,
          title: w.name,
          subtitle: w.slug,
          href: `/admin/workspaces/${w.id}`,
          group: "workspaces" as const,
        })),
    });
  }

  if (canSubs) {
    groups.push({
      key: "subscriptions",
      items: subscriptions
        .filter((s) => match(s.workspaceName, q) || match(s.plan, q) || match(s.status, q))
        .slice(0, LIMIT)
        .map((s) => ({
          id: s.id,
          title: s.workspaceName,
          subtitle: `${s.plan} · ${s.status}`,
          href: `/admin/subscriptions/${s.id}`,
          group: "subscriptions" as const,
        })),
    });
  }

  if (canPlans) {
    const planHits = PLAN_CATALOG.filter(
      (p) => match(p.id, q) || match(p.name, q) || match(p.description, q),
    )
      .slice(0, LIMIT)
      .map((p) => ({
        id: p.id,
        title: p.name,
        subtitle: p.id,
        href: `/admin/plans/${p.id}`,
        group: "plans" as const,
      }));
    groups.push({ key: "plans", items: planHits });
  }

  return groups.filter((g) => g.items.length > 0);
}
