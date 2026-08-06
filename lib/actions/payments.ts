"use server";

import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { softDeleteRow } from "@/lib/data/soft-delete";
import { deriveStatus } from "@/lib/payments/status";
import {
  markPaidSchema,
  markPartialSchema,
  paymentFormSchema,
} from "@/lib/validations/payments";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";
import type { WorkspaceContext } from "@/lib/workspace/session";
import type { Database } from "@/types/database";

type PaymentRow = Database["public"]["Tables"]["payments"]["Row"];

function emptyToNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

async function fetchExistingPayment(
  ctx: WorkspaceContext,
  paymentId: string,
): Promise<PaymentRow | null> {
  const { data } = await ctx.supabase
    .from("payments")
    .select("*")
    .eq("id", paymentId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .maybeSingle();
  return data ?? null;
}

export async function createPaymentAction(
  input: unknown,
): Promise<ActionResult<{ payment: PaymentRow }>> {
  const parsed = paymentFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  const data = parsed.data;
  if (data.paidAmount > data.amount && !data.allowOverpay) {
    return actionError(
      "Suma plătită nu poate fi mai mare decât suma totală. Activează opțiunea de suprasumă pentru a continua.",
    );
  }

  let ctx: WorkspaceContext;
  try {
    ctx = await requireWorkspaceAction("payments.write");
  } catch {
    return actionError("Nu ai permisiunea de a crea plăți.");
  }

  const dueDate = emptyToNull(data.dueDate);
  const status = deriveStatus(data.amount, data.paidAmount, dueDate, false);

  const { data: payment, error } = await ctx.supabase
    .from("payments")
    .insert({
      workspace_id: ctx.activeWorkspace.id,
      client_id: data.clientId ?? null,
      contract_id: data.contractId ?? null,
      project_id: data.projectId ?? null,
      label: data.label.trim(),
      amount: data.amount,
      paid_amount: data.paidAmount,
      due_date: dueDate,
      method: data.method ?? null,
      status,
      reference: emptyToNull(data.reference),
      notes: emptyToNull(data.notes),
      proof_url: emptyToNull(data.proofUrl),
      currency: data.currency,
      paid_at: status === "paid" ? new Date().toISOString() : null,
      created_by: ctx.user.id,
    })
    .select("*")
    .single();

  if (error || !payment) {
    if (process.env.NODE_ENV === "development") {
      console.error("[payments.create]", error?.message);
    }
    return actionError("Nu am putut crea plata.");
  }

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "payment",
    entityId: payment.id,
    action: "payment.created",
    title: "Plată creată",
    description: payment.label,
    metadata: { amount: payment.amount, status: payment.status },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payments");
  return actionSuccess("Plată creată.", { payment });
}

export async function updatePaymentAction(
  paymentId: string,
  input: unknown,
): Promise<ActionResult<{ payment: PaymentRow }>> {
  const parsed = paymentFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  const data = parsed.data;
  if (data.paidAmount > data.amount && !data.allowOverpay) {
    return actionError(
      "Suma plătită nu poate fi mai mare decât suma totală. Activează opțiunea de suprasumă pentru a continua.",
    );
  }

  let ctx: WorkspaceContext;
  try {
    ctx = await requireWorkspaceAction("payments.write");
  } catch {
    return actionError("Nu ai permisiunea de a edita plăți.");
  }

  const existing = await fetchExistingPayment(ctx, paymentId);
  if (!existing) return actionError("Plata nu a fost găsită.");
  if (existing.status === "cancelled") {
    return actionError("Nu poți edita o plată anulată.");
  }

  const dueDate = emptyToNull(data.dueDate);
  const status = deriveStatus(data.amount, data.paidAmount, dueDate, false);
  const paidAt = status === "paid" ? existing.paid_at ?? new Date().toISOString() : null;

  const { data: payment, error } = await ctx.supabase
    .from("payments")
    .update({
      client_id: data.clientId ?? null,
      contract_id: data.contractId ?? null,
      project_id: data.projectId ?? null,
      label: data.label.trim(),
      amount: data.amount,
      paid_amount: data.paidAmount,
      due_date: dueDate,
      method: data.method ?? null,
      status,
      reference: emptyToNull(data.reference),
      notes: emptyToNull(data.notes),
      proof_url: emptyToNull(data.proofUrl),
      currency: data.currency,
      paid_at: paidAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) return actionError("Nu am putut actualiza plata.");
  if (!payment) return actionError("Plata nu a fost găsită.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "payment",
    entityId: payment.id,
    action: "payment.updated",
    title: "Plată actualizată",
    description: payment.label,
    metadata: { amount: payment.amount, status: payment.status },
  });

  revalidatePath("/dashboard/payments");
  revalidatePath(`/dashboard/payments/${paymentId}`);
  return actionSuccess("Plată actualizată.", { payment });
}

export async function markPaidAction(
  paymentId: string,
  input: unknown = {},
): Promise<ActionResult<{ payment: PaymentRow }>> {
  const parsed = markPaidSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx: WorkspaceContext;
  try {
    ctx = await requireWorkspaceAction("payments.write");
  } catch {
    return actionError("Nu ai permisiunea de a actualiza plăți.");
  }

  const existing = await fetchExistingPayment(ctx, paymentId);
  if (!existing) return actionError("Plata nu a fost găsită.");
  if (existing.status === "cancelled") return actionError("Plata este anulată.");

  const paidAt = emptyToNull(parsed.data.paidAt) ?? new Date().toISOString();

  const { data: payment, error } = await ctx.supabase
    .from("payments")
    .update({
      paid_amount: existing.amount,
      status: "paid",
      paid_at: paidAt,
      reference: emptyToNull(parsed.data.reference) ?? existing.reference,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) return actionError("Nu am putut marca plata ca încasată.");
  if (!payment) return actionError("Plata nu a fost găsită.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "payment",
    entityId: payment.id,
    action: "payment.paid",
    title: "Plată încasată integral",
    description: payment.label,
    metadata: { amount: payment.amount },
  });

  revalidatePath("/dashboard/payments");
  revalidatePath(`/dashboard/payments/${paymentId}`);
  return actionSuccess("Plată marcată ca încasată.", { payment });
}

export async function markPartialAction(
  paymentId: string,
  input: unknown,
): Promise<ActionResult<{ payment: PaymentRow }>> {
  const parsed = markPartialSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  let ctx: WorkspaceContext;
  try {
    ctx = await requireWorkspaceAction("payments.write");
  } catch {
    return actionError("Nu ai permisiunea de a actualiza plăți.");
  }

  const existing = await fetchExistingPayment(ctx, paymentId);
  if (!existing) return actionError("Plata nu a fost găsită.");
  if (existing.status === "cancelled") return actionError("Plata este anulată.");

  const { paidAmount, allowOverpay } = parsed.data;
  if (paidAmount > existing.amount && !allowOverpay) {
    return actionError(
      "Suma plătită nu poate fi mai mare decât suma totală. Activează opțiunea de suprasumă pentru a continua.",
    );
  }

  const status = deriveStatus(existing.amount, paidAmount, existing.due_date, false);
  const paidAt = status === "paid" ? existing.paid_at ?? new Date().toISOString() : null;

  const { data: payment, error } = await ctx.supabase
    .from("payments")
    .update({
      paid_amount: paidAmount,
      status,
      paid_at: paidAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) return actionError("Nu am putut înregistra plata parțială.");
  if (!payment) return actionError("Plata nu a fost găsită.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "payment",
    entityId: payment.id,
    action: "payment.partial_paid",
    title: "Plată parțială înregistrată",
    description: payment.label,
    metadata: { paidAmount, status: payment.status },
  });

  revalidatePath("/dashboard/payments");
  revalidatePath(`/dashboard/payments/${paymentId}`);
  return actionSuccess("Plată parțială înregistrată.", { payment });
}

export async function cancelPaymentAction(
  paymentId: string,
): Promise<ActionResult<{ payment: PaymentRow }>> {
  let ctx: WorkspaceContext;
  try {
    ctx = await requireWorkspaceAction("payments.write");
  } catch {
    return actionError("Nu ai permisiunea de a anula plăți.");
  }

  const existing = await fetchExistingPayment(ctx, paymentId);
  if (!existing) return actionError("Plata nu a fost găsită.");
  if (existing.status === "cancelled") return actionError("Plata este deja anulată.");

  const { data: payment, error } = await ctx.supabase
    .from("payments")
    .update({
      status: "cancelled",
      cancelled_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("workspace_id", ctx.activeWorkspace.id)
    .is("deleted_at", null)
    .select("*")
    .maybeSingle();

  if (error) return actionError("Nu am putut anula plata.");
  if (!payment) return actionError("Plata nu a fost găsită.");

  // Audit: cancellation is a sensitive financial action and must always be logged.
  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "payment",
    entityId: payment.id,
    action: "payment.cancelled",
    title: "Plată anulată",
    description: payment.label,
    metadata: { amount: payment.amount, paidAmount: payment.paid_amount },
  });

  revalidatePath("/dashboard/payments");
  revalidatePath(`/dashboard/payments/${paymentId}`);
  return actionSuccess("Plată anulată.", { payment });
}

export async function softDeletePaymentAction(paymentId: string): Promise<ActionResult> {
  let ctx: WorkspaceContext;
  try {
    ctx = await requireWorkspaceAction("payments.delete");
  } catch {
    return actionError("Nu ai permisiunea de a șterge plăți.");
  }

  const existing = await fetchExistingPayment(ctx, paymentId);
  if (!existing) return actionError("Plata nu a fost găsită.");

  if (existing.contract_id && existing.status !== "cancelled") {
    const { data: contract } = await ctx.supabase
      .from("contracts")
      .select("status")
      .eq("id", existing.contract_id)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .maybeSingle();

    if (contract?.status === "accepted") {
      return actionError(
        "Nu poți șterge o plată legată de un contract acceptat. Anulează plata mai întâi.",
      );
    }
  }

  const result = await softDeleteRow(ctx.supabase, "payments", ctx.activeWorkspace.id, paymentId);
  if (!result.ok) return actionError("Nu am putut șterge plata.");

  await logActivity(ctx.supabase, {
    workspaceId: ctx.activeWorkspace.id,
    actorId: ctx.user.id,
    entityType: "payment",
    entityId: paymentId,
    action: "payment.deleted",
    title: "Plată ștearsă",
    description: existing.label,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/payments");
  return actionSuccess("Plată ștearsă.");
}
