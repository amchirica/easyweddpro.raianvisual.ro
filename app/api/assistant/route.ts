import { NextResponse } from "next/server";
import { z } from "zod";

import { buildAssistantContext } from "@/lib/assistant/context";
import { normalizeLocale } from "@/lib/assistant/i18n";
import { answerWithOptionalAi } from "@/lib/assistant/provider";
import { checkAssistantRateLimit } from "@/lib/assistant/rate-limit";
import { getWorkspacePlan } from "@/lib/billing/plans";
import { isDemoMode } from "@/lib/env";
import { getPlatformAdminRole } from "@/lib/platform/session";
import { canPerformPlatformAction } from "@/lib/platform/permissions";
import { getSessionContext } from "@/lib/workspace/session";

export const runtime = "nodejs";

const bodySchema = z.object({
  message: z.string().trim().min(2).max(1000),
  pathname: z.string().trim().min(1).max(500),
  locale: z.string().optional(),
  surface: z.enum(["dashboard", "admin"]),
});

export async function POST(request: Request) {
  const started = Date.now();

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const { message, pathname, surface } = parsed.data;
  const locale = normalizeLocale(parsed.data.locale);

  try {
    if (isDemoMode() && surface === "dashboard") {
      const ctx = buildAssistantContext({
        surface: "dashboard",
        pathname,
        locale,
        workspaceRole: "owner",
        plan: "studio",
      });
      const answer = await answerWithOptionalAi(message, ctx);
      return NextResponse.json({
        ...answer,
        eventId: null,
        latencyMs: Date.now() - started,
        demo: true,
      });
    }

    const session = await getSessionContext();
    if (!session || session.isDemo || !session.user || !session.supabase) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    if (surface === "admin") {
      const role = await getPlatformAdminRole(session.supabase, session.user.id);
      if (!role || !canPerformPlatformAction(role, "admin.access")) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }

      const rl = await checkAssistantRateLimit(session.supabase, session.user.id);
      if (!rl.ok) {
        return NextResponse.json(
          { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
          { status: 429 },
        );
      }

      const ctx = buildAssistantContext({
        surface: "admin",
        pathname,
        locale,
        platformRole: role,
        workspaceRole: null,
        plan: null,
      });

      const answer = await answerWithOptionalAi(message, ctx);
      const latency = Date.now() - started;

      const { data: event } = await session.supabase
        .from("assistant_events")
        .insert({
          user_id: session.user.id,
          workspace_id: null,
          surface: "admin",
          module_key: answer.moduleKey,
          intent: answer.intent,
          resolved: answer.resolved,
          provider: answer.provider,
          latency_ms: latency,
        })
        .select("id")
        .maybeSingle();

      return NextResponse.json({
        ...answer,
        eventId: event?.id ?? null,
        latencyMs: latency,
      });
    }

    if (!session.activeWorkspace || !session.role) {
      return NextResponse.json({ error: "no_workspace" }, { status: 403 });
    }

    const rl = await checkAssistantRateLimit(session.supabase, session.user.id);
    if (!rl.ok) {
      return NextResponse.json(
        { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
        { status: 429 },
      );
    }

    const plan = await getWorkspacePlan(session.supabase, session.activeWorkspace.id);

    const ctx = buildAssistantContext({
      surface: "dashboard",
      pathname,
      locale,
      workspaceRole: session.role,
      plan: plan.plan,
    });

    const answer = await answerWithOptionalAi(message, ctx);
    const latency = Date.now() - started;

    const { data: event } = await session.supabase
      .from("assistant_events")
      .insert({
        user_id: session.user.id,
        workspace_id: session.activeWorkspace.id,
        surface: "dashboard",
        module_key: answer.moduleKey,
        intent: answer.intent,
        resolved: answer.resolved,
        provider: answer.provider,
        latency_ms: latency,
      })
      .select("id")
      .maybeSingle();

    return NextResponse.json({
      ...answer,
      eventId: event?.id ?? null,
      latencyMs: latency,
    });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(
        "[api.assistant]",
        error instanceof Error ? error.message : "assistant_failed",
      );
    }
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
