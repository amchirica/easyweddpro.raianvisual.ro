import "server-only";

import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { WORKSPACE_COOKIE, type WorkspaceRole } from "@/lib/constants";
import { isDemoMode } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { Database, Json } from "@/types/database";

export type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
export type WorkspaceRow = Database["public"]["Tables"]["workspaces"]["Row"];
export type MembershipRow = Database["public"]["Tables"]["workspace_members"]["Row"];

export type WorkspaceMembership = {
  workspace: WorkspaceRow;
  role: WorkspaceRole;
  membershipId: string;
};

export type WorkspaceContext = {
  user: User;
  profile: ProfileRow | null;
  workspaces: WorkspaceMembership[];
  activeWorkspace: WorkspaceRow;
  role: WorkspaceRole;
  isPlatformAdmin: boolean;
  isInspecting: boolean;
  isDemo: false;
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>;
};

export type DemoWorkspaceContext = {
  user: null;
  profile: null;
  workspaces: [];
  activeWorkspace: null;
  role: null;
  isPlatformAdmin: false;
  isInspecting: false;
  isDemo: true;
  supabase: null;
};

async function readWorkspaceCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(WORKSPACE_COOKIE)?.value ?? null;
}

export async function setActiveWorkspaceId(workspaceId: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, workspaceId, {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 365,
  });
}

export async function getActiveWorkspaceId(): Promise<string | null> {
  return readWorkspaceCookie();
}

export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);
}

export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getCurrentProfile = cache(async () => {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!supabase || !user) return null;

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return data;
});

export const getUserWorkspaces = cache(async (): Promise<WorkspaceMembership[]> => {
  const supabase = await createClient();
  const user = await getCurrentUser();
  if (!supabase || !user) return [];

  const { data: memberships } = await supabase
    .from("workspace_members")
    .select("id, role, workspace_id")
    .eq("user_id", user.id);

  if (!memberships?.length) return [];

  const ids = memberships.map((m) => m.workspace_id);
  const { data: workspaces } = await supabase
    .from("workspaces")
    .select("*")
    .in("id", ids)
    .order("created_at", { ascending: true });

  const byId = new Map((workspaces ?? []).map((w) => [w.id, w]));

  return memberships
    .map((m) => {
      const workspace = byId.get(m.workspace_id);
      if (!workspace) return null;
      return {
        workspace,
        role: m.role as WorkspaceRole,
        membershipId: m.id,
      };
    })
    .filter((item): item is WorkspaceMembership => item !== null);
});

export const getActiveWorkspace = cache(async () => {
  const workspaces = await getUserWorkspaces();
  if (workspaces.length === 0) return null;

  const cookieId = await readWorkspaceCookie();
  const matched = workspaces.find((w) => w.workspace.id === cookieId);
  return matched ?? workspaces[0] ?? null;
});

const demoContext = {
  user: null,
  profile: null,
  workspaces: [] as WorkspaceMembership[],
  activeWorkspace: null,
  role: null,
  isPlatformAdmin: false,
  isInspecting: false as const,
  isDemo: true as const,
  supabase: null,
};

export const getSessionContext = cache(async () => {
  if (isDemoMode()) {
    const supabase = await createClient();
    const user = supabase ? (await supabase.auth.getUser()).data.user : null;
    // Explicit demo without session → demo UI
    if (!user) {
      return demoContext;
    }
  }

  const supabase = await createClient();
  if (!supabase) {
    if (isDemoMode()) {
      return demoContext;
    }
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    if (isDemoMode()) {
      return demoContext;
    }
    return null;
  }

  const [{ data: profile }, workspaces, { data: isPlatformAdmin }] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
    getUserWorkspaces(),
    supabase.rpc("is_platform_admin"),
  ]);

  const cookieId = await readWorkspaceCookie();
  let activeMembership =
    workspaces.find((w) => w.workspace.id === cookieId) ?? workspaces[0] ?? null;
  let resolvedWorkspaces = workspaces;
  let isInspecting = false;

  if (isPlatformAdmin) {
    const { getActiveInspectSession } = await import("@/lib/platform/inspect");
    const inspect = await getActiveInspectSession();
    if (inspect) {
      const { data: inspectWorkspace } = await supabase
        .from("workspaces")
        .select("*")
        .eq("id", inspect.workspaceId)
        .maybeSingle();

      if (inspectWorkspace) {
        const inspectMembership: WorkspaceMembership = {
          workspace: inspectWorkspace,
          role: "viewer",
          membershipId: `inspect:${inspect.id}`,
        };
        resolvedWorkspaces = [
          inspectMembership,
          ...workspaces.filter((w) => w.workspace.id !== inspectWorkspace.id),
        ];
        activeMembership = inspectMembership;
        isInspecting = true;
      }
    }
  }

  return {
    user,
    profile,
    workspaces: resolvedWorkspaces,
    activeWorkspace: activeMembership?.workspace ?? null,
    role: activeMembership?.role ?? null,
    isPlatformAdmin: Boolean(isPlatformAdmin),
    isInspecting,
    isDemo: false as const,
    supabase,
  };
});

export async function requireUser() {
  const ctx = await getSessionContext();
  if (!ctx || !ctx.user || !ctx.supabase) {
    if (ctx?.isDemo) {
      redirect("/login");
    }
    redirect("/login");
  }
  return {
    user: ctx.user,
    profile: ctx.profile,
    supabase: ctx.supabase,
    isPlatformAdmin: ctx.isPlatformAdmin,
  };
}

export async function requireWorkspace(): Promise<WorkspaceContext> {
  const ctx = await getSessionContext();

  if (ctx?.isDemo) {
    redirect("/login?error=demo_requires_auth");
  }

  if (!ctx?.user || !ctx.supabase) {
    redirect("/login");
  }

  if (!ctx.activeWorkspace || !ctx.role) {
    redirect("/onboarding");
  }

  return {
    user: ctx.user,
    profile: ctx.profile,
    workspaces: ctx.workspaces,
    activeWorkspace: ctx.activeWorkspace,
    role: ctx.role,
    isPlatformAdmin: ctx.isPlatformAdmin,
    isInspecting: ctx.isInspecting,
    isDemo: false,
    supabase: ctx.supabase,
  };
}

export async function requirePlatformAdmin() {
  const { requirePlatformPermission } = await import("@/lib/platform/session");
  return requirePlatformPermission("admin.access");
}

/** For pages that support demo fixtures when unauthenticated in demo mode. */
export async function getWorkspaceOrDemo() {
  const ctx = await getSessionContext();

  if (!ctx) {
    redirect("/login");
  }

  if (ctx.isDemo) {
    // Demo fixtures are disabled — authenticated Supabase workspace required.
    redirect("/login?error=demo_requires_auth");
  }

  if (!ctx.user || !ctx.supabase) {
    redirect("/login");
  }

  if (!ctx.activeWorkspace || !ctx.role) {
    redirect("/onboarding");
  }

  return {
    mode: "live" as const,
    user: ctx.user,
    profile: ctx.profile,
    workspace: ctx.activeWorkspace,
    role: ctx.role,
    workspaces: ctx.workspaces,
    isPlatformAdmin: ctx.isPlatformAdmin,
    isInspecting: ctx.isInspecting,
    supabase: ctx.supabase,
  };
}

export type WorkspaceSettings = {
  firstPackage?: { name: string; price: number } | null;
  importSkipped?: boolean;
  [key: string]: Json | undefined;
};
