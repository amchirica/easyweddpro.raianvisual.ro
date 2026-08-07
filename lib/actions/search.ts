"use server";

import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import {
  canPerformPlatformAction,
} from "@/lib/platform/permissions";
import { getPlatformAdminContext } from "@/lib/platform/session";
import { searchPlatform, type PlatformSearchGroup } from "@/lib/search/platform-search";
import { searchWorkspace, type SearchGroup } from "@/lib/search/workspace-search";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";

export async function searchWorkspaceAction(
  query: string,
): Promise<ActionResult<{ groups: SearchGroup[] }>> {
  try {
    const q = query.trim();
    if (q.length < 2) {
      return actionSuccess("ok", { groups: [] });
    }
    const ctx = await requireWorkspaceAction("crm.read");
    const groups = await searchWorkspace(ctx.supabase, ctx.activeWorkspace.id, q);
    return actionSuccess("ok", { groups });
  } catch (error) {
    const message = error instanceof Error ? error.message : "search_failed";
    if (message === "forbidden" || message === "forbidden_inspect_readonly") {
      return actionError("forbidden");
    }
    return actionError(message);
  }
}

export async function searchPlatformAction(
  query: string,
): Promise<ActionResult<{ groups: PlatformSearchGroup[] }>> {
  try {
    const q = query.trim();
    if (q.length < 2) {
      return actionSuccess("ok", { groups: [] });
    }

    const admin = await getPlatformAdminContext();
    if (!admin || !canPerformPlatformAction(admin.platformRole, "admin.access")) {
      return actionError("forbidden");
    }

    const groups = await searchPlatform(admin.supabase, q, admin.platformRole);
    return actionSuccess("ok", { groups });
  } catch (error) {
    const message = error instanceof Error ? error.message : "search_failed";
    return actionError(message);
  }
}
