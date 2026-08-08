"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { canCreateResource, getUsageForWorkspace } from "@/lib/billing/plans";
import { buildProposalSnapshot } from "@/lib/data/proposals";
import { notifyProposalDecision } from "@/lib/notifications/events";
import { computeProposalTotals } from "@/lib/proposals/money";
import { canEditProposal, getEffectiveProposalStatus } from "@/lib/proposals/status";
import { generateProposalPublicToken } from "@/lib/proposals/token";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  acceptProposalSchema,
  proposalFormSchema,
  rejectProposalSchema,
} from "@/lib/validations/proposals";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";

function emptyToNull(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

async function replaceItems(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  workspaceId: string,
  proposalId: string,
  items: ReturnType<typeof computeProposalTotals>["items"],
) {
  await supabase.from("proposal_items").delete().eq("proposal_id", proposalId).eq("workspace_id", workspaceId);

  const { error } = await supabase.from("proposal_items").insert(
    items.map((item, index) => ({
      workspace_id: workspaceId,
      proposal_id: proposalId,
      name: item.name,
      description: emptyToNull(item.description ?? null),
      quantity: item.quantity,
      unit_price: item.unitPrice,
      discount: item.discount,
      tax_rate: item.taxRate,
      line_total: item.lineTotal,
      sort_order: item.sortOrder ?? index,
    })),
  );
  if (error) throw new Error(error.message);
}

export async function createProposalAction(
  input: unknown,
): Promise<ActionResult<{ proposalId: string }>> {
  const parsed = proposalFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  try {
    const ctx = await requireWorkspaceAction("proposals.write");
    const usage = await getUsageForWorkspace(ctx.supabase, ctx.activeWorkspace.id);
    const limitCheck = canCreateResource(usage.plan, "proposal", usage);
    if (!limitCheck.ok) {
      return actionError(limitCheck.reason);
    }

    let totals;
    try {
      totals = computeProposalTotals({
        items: parsed.data.items.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          sortOrder: item.sortOrder,
        })),
        discountType: parsed.data.discountType,
        discountValue: parsed.data.discountValue,
        taxRate: parsed.data.taxRate,
      });
    } catch {
      return actionError("Calculele financiare sunt invalide.");
    }

    const { data: number, error: numberError } = await ctx.supabase.rpc(
      "next_proposal_number",
      { p_workspace_id: ctx.activeWorkspace.id },
    );
    if (numberError || !number) {
      return actionError("Nu am putut genera numărul ofertei.");
    }

    const token = generateProposalPublicToken();

    const { data: proposal, error } = await ctx.supabase
      .from("proposals")
      .insert({
        workspace_id: ctx.activeWorkspace.id,
        client_id: parsed.data.clientId ?? null,
        lead_id: parsed.data.leadId ?? null,
        title: parsed.data.title.trim(),
        proposal_number: number,
        status: "draft",
        currency: parsed.data.currency,
        subtotal: totals.subtotal,
        discount_type: parsed.data.discountType,
        discount_value: parsed.data.discountValue,
        discount_amount: totals.discountAmount,
        tax_rate: parsed.data.taxRate,
        tax_amount: totals.taxAmount,
        total: totals.total,
        amount: totals.total,
        valid_until: emptyToNull(parsed.data.validUntil),
        public_token: token,
        notes: emptyToNull(parsed.data.notes),
        terms: emptyToNull(parsed.data.terms),
        created_by: ctx.user.id,
        package_name: totals.items[0]?.name ?? null,
      })
      .select("id")
      .single();

    if (error || !proposal) {
      if (process.env.NODE_ENV === "development") console.error("[proposals.create]", error?.message);
      return actionError("Nu am putut crea oferta.");
    }

    await replaceItems(ctx.supabase, ctx.activeWorkspace.id, proposal.id, totals.items);

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "proposal",
      entityId: proposal.id,
      action: "proposal.created",
      title: "Ofertă creată",
      description: parsed.data.title,
      metadata: { proposal_number: number },
    });

    revalidatePath("/dashboard/proposals");
    return actionSuccess("Ofertă creată.", { proposalId: proposal.id });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a crea oferte.");
    }
    return actionError("Nu am putut crea oferta.");
  }
}

export async function updateProposalAction(
  proposalId: string,
  input: unknown,
): Promise<ActionResult<{ proposalId: string }>> {
  const parsed = proposalFormSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  try {
    const ctx = await requireWorkspaceAction("proposals.write");

    const { data: existing } = await ctx.supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!existing) return actionError("Oferta nu a fost găsită.");

    const effective = getEffectiveProposalStatus({
      status: existing.status,
      validUntil: existing.valid_until,
      publicTokenExpiresAt: existing.public_token_expires_at,
      acceptedAt: existing.accepted_at,
    });

    if (!canEditProposal(effective) || existing.status === "accepted") {
      return actionError("Oferta acceptată nu poate fi editată. Duplică oferta pentru o versiune nouă.");
    }

    let totals;
    try {
      totals = computeProposalTotals({
        items: parsed.data.items.map((item) => ({
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount,
          taxRate: item.taxRate,
          sortOrder: item.sortOrder,
        })),
        discountType: parsed.data.discountType,
        discountValue: parsed.data.discountValue,
        taxRate: parsed.data.taxRate,
      });
    } catch {
      return actionError("Calculele financiare sunt invalide.");
    }

    const { error } = await ctx.supabase
      .from("proposals")
      .update({
        client_id: parsed.data.clientId ?? null,
        lead_id: parsed.data.leadId ?? null,
        title: parsed.data.title.trim(),
        currency: parsed.data.currency,
        subtotal: totals.subtotal,
        discount_type: parsed.data.discountType,
        discount_value: parsed.data.discountValue,
        discount_amount: totals.discountAmount,
        tax_rate: parsed.data.taxRate,
        tax_amount: totals.taxAmount,
        total: totals.total,
        amount: totals.total,
        valid_until: emptyToNull(parsed.data.validUntil),
        notes: emptyToNull(parsed.data.notes),
        terms: emptyToNull(parsed.data.terms),
        package_name: totals.items[0]?.name ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut actualiza oferta.");

    await replaceItems(ctx.supabase, ctx.activeWorkspace.id, proposalId, totals.items);

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "proposal",
      entityId: proposalId,
      action: "proposal.updated",
      title: "Ofertă actualizată",
      description: parsed.data.title,
    });

    revalidatePath("/dashboard/proposals");
    revalidatePath(`/dashboard/proposals/${proposalId}`);
    return actionSuccess("Ofertă actualizată.", { proposalId });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a edita oferte.");
    }
    return actionError("Nu am putut actualiza oferta.");
  }
}

export async function publishProposalAction(
  proposalId: string,
): Promise<ActionResult<{ publicUrlPath: string }>> {
  try {
    const ctx = await requireWorkspaceAction("proposals.write");

    const { data: proposal } = await ctx.supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!proposal) return actionError("Oferta nu a fost găsită.");
    if (proposal.status === "accepted") {
      return actionError("Oferta este deja acceptată.");
    }

    const { data: items } = await ctx.supabase
      .from("proposal_items")
      .select("*")
      .eq("proposal_id", proposalId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .order("sort_order", { ascending: true });

    if (!items?.length) return actionError("Adaugă cel puțin un item înainte de publicare.");

    let clientName: string | null = null;
    if (proposal.client_id) {
      const { data: client } = await ctx.supabase
        .from("clients")
        .select("name")
        .eq("id", proposal.client_id)
        .maybeSingle();
      clientName = client?.name ?? null;
    }

    const snapshot = buildProposalSnapshot({
      clientName,
      providerName: ctx.activeWorkspace.name,
      currency: proposal.currency,
      items: items.map((item) => ({
        name: item.name,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        discount: Number(item.discount),
        taxRate: Number(item.tax_rate),
        lineTotal: Number(item.line_total),
      })),
      subtotal: Number(proposal.subtotal),
      discountType: proposal.discount_type,
      discountValue: Number(proposal.discount_value),
      discountAmount: Number(proposal.discount_amount),
      taxRate: Number(proposal.tax_rate),
      taxAmount: Number(proposal.tax_amount),
      total: Number(proposal.total),
      terms: proposal.terms,
      validUntil: proposal.valid_until,
      title: proposal.title,
      proposalNumber: proposal.proposal_number,
    });

    const token = proposal.public_token || generateProposalPublicToken();
    const expiresAt = proposal.valid_until
      ? new Date(`${proposal.valid_until}T23:59:59.000Z`).toISOString()
      : null;

    const { error } = await ctx.supabase
      .from("proposals")
      .update({
        status: proposal.status === "viewed" ? "viewed" : "sent",
        public_token: token,
        public_token_expires_at: expiresAt,
        snapshot,
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut publica oferta.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "proposal",
      entityId: proposalId,
      action: "proposal.published",
      title: "Ofertă publicată",
      description: "Linkul public a fost generat.",
    });

    revalidatePath("/dashboard/proposals");
    revalidatePath(`/dashboard/proposals/${proposalId}`);
    return actionSuccess("Ofertă publicată.", { publicUrlPath: `/p/${token}` });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a publica oferte.");
    }
    return actionError("Nu am putut publica oferta.");
  }
}

export async function duplicateProposalAction(
  proposalId: string,
): Promise<ActionResult<{ proposalId: string }>> {
  try {
    const ctx = await requireWorkspaceAction("proposals.write");

    const { data: source } = await ctx.supabase
      .from("proposals")
      .select("*")
      .eq("id", proposalId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!source) return actionError("Oferta nu a fost găsită.");

    const { data: sourceItems } = await ctx.supabase
      .from("proposal_items")
      .select("*")
      .eq("proposal_id", proposalId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    const { data: number } = await ctx.supabase.rpc("next_proposal_number", {
      p_workspace_id: ctx.activeWorkspace.id,
    });
    if (!number) return actionError("Nu am putut genera numărul ofertei.");

    const token = generateProposalPublicToken();
    const { data: created, error } = await ctx.supabase
      .from("proposals")
      .insert({
        workspace_id: ctx.activeWorkspace.id,
        client_id: source.client_id,
        lead_id: source.lead_id,
        title: `${source.title} (copie)`,
        proposal_number: number,
        status: "draft",
        currency: source.currency,
        subtotal: source.subtotal,
        discount_type: source.discount_type,
        discount_value: source.discount_value,
        discount_amount: source.discount_amount,
        tax_rate: source.tax_rate,
        tax_amount: source.tax_amount,
        total: source.total,
        amount: source.total,
        valid_until: source.valid_until,
        public_token: token,
        notes: source.notes,
        terms: source.terms,
        created_by: ctx.user.id,
        package_name: source.package_name,
      })
      .select("id")
      .single();

    if (error || !created) return actionError("Nu am putut duplica oferta.");

    const items = sourceItems ?? [];

    if (items.length) {
      await ctx.supabase.from("proposal_items").insert(
        items.map((item) => ({
          workspace_id: ctx.activeWorkspace.id,
          proposal_id: created.id,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          tax_rate: item.tax_rate,
          line_total: item.line_total,
          sort_order: item.sort_order,
        })),
      );
    }

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "proposal",
      entityId: created.id,
      action: "proposal.duplicated",
      title: "Ofertă duplicată",
      description: source.title,
      metadata: { source_id: proposalId },
    });

    revalidatePath("/dashboard/proposals");
    return actionSuccess("Ofertă duplicată.", { proposalId: created.id });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a duplica oferte.");
    }
    return actionError("Nu am putut duplica oferta.");
  }
}

export async function cancelProposalAction(proposalId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("proposals.write");
    const { data: proposal } = await ctx.supabase
      .from("proposals")
      .select("id, status")
      .eq("id", proposalId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!proposal) return actionError("Oferta nu a fost găsită.");
    if (proposal.status === "accepted") {
      return actionError("Nu poți anula o ofertă acceptată.");
    }

    const { error } = await ctx.supabase
      .from("proposals")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", proposalId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut anula oferta.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "proposal",
      entityId: proposalId,
      action: "proposal.cancelled",
      title: "Ofertă anulată",
    });

    revalidatePath("/dashboard/proposals");
    revalidatePath(`/dashboard/proposals/${proposalId}`);
    return actionSuccess("Ofertă anulată.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a anula oferte.");
    }
    return actionError("Nu am putut anula oferta.");
  }
}

export async function deleteProposalAction(proposalId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("proposals.delete");
    const { data: proposal } = await ctx.supabase
      .from("proposals")
      .select("id, status, title")
      .eq("id", proposalId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!proposal) return actionError("Oferta nu a fost găsită.");
    if (proposal.status !== "draft" && proposal.status !== "cancelled") {
      return actionError("Poți șterge doar ciornele sau ofertele anulate.");
    }

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "proposal",
      entityId: proposalId,
      action: "proposal.deleted",
      title: "Ofertă ștearsă",
      description: proposal.title,
    });

    const { error } = await ctx.supabase
      .from("proposals")
      .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", proposalId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut șterge oferta.");

    revalidatePath("/dashboard/proposals");
    return actionSuccess("Ofertă ștearsă.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a șterge oferte.");
    }
    return actionError("Nu am putut șterge oferta.");
  }
}

export async function convertProposalToContractAction(
  proposalId: string,
): Promise<ActionResult<{ contractId: string }>> {
  const { convertProposalToContractRpc } = await import("@/lib/actions/contracts");
  return convertProposalToContractRpc(proposalId);
}

export async function acceptPublicProposalAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = acceptProposalSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  const supabase = await createClient();
  if (!supabase) return actionError("Serviciul nu este disponibil.");

  const headerStore = await headers();
  const ip =
    headerStore.get("cf-connecting-ip") ||
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    null;
  const userAgent = headerStore.get("user-agent");

  const { data, error } = await supabase.rpc("accept_proposal_by_token", {
    p_token: parsed.data.token,
    p_full_name: parsed.data.fullName,
    p_email: parsed.data.email,
    p_accepted_terms: parsed.data.acceptedTerms,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("terms_required")) return actionError("Trebuie să accepți condițiile.");
    if (msg.includes("proposal_expired")) return actionError("Oferta a expirat.");
    if (msg.includes("proposal_not_acceptable")) return actionError("Oferta nu mai poate fi acceptată.");
    if (msg.includes("proposal_not_found")) return actionError("Oferta nu a fost găsită.");
    if (process.env.NODE_ENV === "development") console.error("[proposals.accept]", msg);
    return actionError("Nu am putut înregistra acceptarea.");
  }

  const result = data as { ok?: boolean; already?: boolean } | null;

  if (!result?.already) {
    try {
      const admin = createAdminClient();
      const { data: proposal } = await admin
        .from("proposals")
        .select("id, title, workspace_id")
        .eq("public_token", parsed.data.token)
        .maybeSingle();
      if (proposal) {
        void notifyProposalDecision(
          admin,
          proposal.workspace_id,
          { id: proposal.id, title: proposal.title },
          "accepted",
        );
      }
    } catch (notifyError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[proposals.accept.notify]", notifyError);
      }
    }
  }

  return actionSuccess(
    result?.already
      ? "Oferta era deja acceptată."
      : "Acceptare digitală înregistrată. Mulțumim!",
  );
}

export async function rejectPublicProposalAction(
  input: unknown,
): Promise<ActionResult> {
  const parsed = rejectProposalSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  const supabase = await createClient();
  if (!supabase) return actionError("Serviciul nu este disponibil.");

  const { error } = await supabase.rpc("reject_proposal_by_token", {
    p_token: parsed.data.token,
    p_reason: parsed.data.reason || null,
  });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("already_accepted")) {
      return actionError("Oferta este deja acceptată și nu mai poate fi refuzată.");
    }
    if (msg.includes("proposal_not_found")) return actionError("Oferta nu a fost găsită.");
    return actionError("Nu am putut înregistra refuzul.");
  }

  try {
    const admin = createAdminClient();
    const { data: proposal } = await admin
      .from("proposals")
      .select("id, title, workspace_id")
      .eq("public_token", parsed.data.token)
      .maybeSingle();
    if (proposal) {
      void notifyProposalDecision(
        admin,
        proposal.workspace_id,
        { id: proposal.id, title: proposal.title },
        "rejected",
      );
    }
  } catch (notifyError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[proposals.reject.notify]", notifyError);
    }
  }

  return actionSuccess("Oferta a fost refuzată.");
}
