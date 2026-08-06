import { NextResponse, type NextRequest } from "next/server";

import { runAutomationsForTrigger } from "@/lib/automations/engine";
import { notifyWorkspaceManagers } from "@/lib/notifications/create";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Cron entry point — scans for overdue payments/tasks and fans out to
 * `payment_overdue` / `task_overdue` automations + owner/admin/manager
 * notifications.
 *
 * Env: CRON_SECRET (server-only, never NEXT_PUBLIC_). Configure your
 * scheduler (Cloudflare Cron Trigger, GitHub Actions, external cron, etc.)
 * to call this route once a day with `Authorization: Bearer ${CRON_SECRET}`.
 * Requests without a valid token get 401; the secret itself is never logged.
 */

export const dynamic = "force-dynamic";

type AdminClient = ReturnType<typeof createAdminClient>;

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  return header === `Bearer ${secret}`;
}

function todayDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

function startOfTodayIso(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
}

/** Dedupe notification fan-out per entity/day — automation runs are separately idempotent. */
async function alreadyNotifiedToday(
  supabase: AdminClient,
  workspaceId: string,
  type: string,
  entityId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from("notifications")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("type", type)
    .eq("entity_id", entityId)
    .gte("created_at", startOfTodayIso())
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

type ScanResult = { scanned: number; notified: number };

async function processOverduePayments(supabase: AdminClient, today: string): Promise<ScanResult> {
  const { data: payments, error } = await supabase
    .from("payments")
    .select("id, workspace_id, label, amount, currency, due_date")
    .in("status", ["pending", "partial"])
    .lt("due_date", today)
    .is("deleted_at", null)
    .limit(500);

  if (error || !payments?.length) return { scanned: 0, notified: 0 };

  let notified = 0;
  for (const payment of payments) {
    if (!payment.due_date) continue;

    await runAutomationsForTrigger({
      supabase,
      workspaceId: payment.workspace_id,
      triggerKey: "payment_overdue",
      entityId: payment.id,
      idempotencyKey: `payment_overdue:${payment.id}:${today}`,
      metadata: { amount: payment.amount, currency: payment.currency, dueDate: payment.due_date },
    });

    const already = await alreadyNotifiedToday(supabase, payment.workspace_id, "payment_overdue", payment.id);
    if (!already) {
      await notifyWorkspaceManagers(supabase, payment.workspace_id, {
        type: "payment_overdue",
        title: "Plată restantă",
        body: payment.label
          ? `„${payment.label}” este restantă din ${payment.due_date}.`
          : `O plată este restantă din ${payment.due_date}.`,
        entityType: "payment",
        entityId: payment.id,
        actionUrl: "/dashboard/payments",
      });
      notified += 1;
    }
  }

  return { scanned: payments.length, notified };
}

async function processOverdueTasks(supabase: AdminClient, today: string): Promise<ScanResult> {
  const { data: tasks, error } = await supabase
    .from("tasks")
    .select("id, workspace_id, title, due_date")
    .not("status", "in", '("done","cancelled")')
    .lt("due_date", today)
    .is("deleted_at", null)
    .limit(500);

  if (error || !tasks?.length) return { scanned: 0, notified: 0 };

  let notified = 0;
  for (const task of tasks) {
    if (!task.due_date) continue;

    await runAutomationsForTrigger({
      supabase,
      workspaceId: task.workspace_id,
      triggerKey: "task_overdue",
      entityId: task.id,
      idempotencyKey: `task_overdue:${task.id}:${today}`,
      metadata: { title: task.title, dueDate: task.due_date },
    });

    const already = await alreadyNotifiedToday(supabase, task.workspace_id, "task_overdue", task.id);
    if (!already) {
      await notifyWorkspaceManagers(supabase, task.workspace_id, {
        type: "task_overdue",
        title: "Task întârziat",
        body: `„${task.title}” are termenul depășit din ${task.due_date}.`,
        entityType: "task",
        entityId: task.id,
        actionUrl: "/dashboard/tasks",
      });
      notified += 1;
    }
  }

  return { scanned: tasks.length, notified };
}

async function handleCronRequest(request: NextRequest): Promise<NextResponse> {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let supabase: AdminClient;
  try {
    supabase = createAdminClient();
  } catch {
    return NextResponse.json({ error: "supabase_not_configured" }, { status: 500 });
  }

  const today = todayDateString();

  try {
    const [payments, tasks] = await Promise.all([
      processOverduePayments(supabase, today),
      processOverdueTasks(supabase, today),
    ]);

    return NextResponse.json({ ok: true, date: today, payments, tasks });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[cron.automations]", error);
    }
    return NextResponse.json({ error: "cron_run_failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCronRequest(request);
}

export async function POST(request: NextRequest) {
  return handleCronRequest(request);
}
