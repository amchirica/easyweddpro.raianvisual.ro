"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { z } from "zod";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { runAutomationsForTrigger } from "@/lib/automations/engine";
import { canCreateResource, getUsageForWorkspace } from "@/lib/billing/plans";
import {
  DEFAULT_CONTRACT_SECTIONS,
  parseContractContent,
  type ContractContent,
  type ContractSections,
  type ContractServiceItem,
} from "@/lib/contracts/content";
import { computeContractMoney } from "@/lib/contracts/money";
import { buildContractSnapshot } from "@/lib/contracts/snapshot";
import {
  canCancelContract,
  canCreateNewVersion,
  canEditContract,
  canPublishContract,
  getEffectiveContractStatus,
} from "@/lib/contracts/status";
import {
  hasUnresolvedCriticalPlaceholders,
  resolveTemplateVariables,
  type TemplateVariableValues,
} from "@/lib/contracts/templates";
import { generateContractPublicToken, generatePortalToken, hashPublicToken } from "@/lib/contracts/token";
import { notifyContractAccepted } from "@/lib/notifications/events";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";
import type { Json } from "@/types/database";

const partySchema = z.object({
  name: z.string().trim().min(1),
  email: z.string().trim().email().optional().nullable().or(z.literal("")),
  phone: z.string().trim().optional().nullable(),
  address: z.string().trim().optional().nullable(),
  fiscalCode: z.string().trim().optional().nullable(),
  regCom: z.string().trim().optional().nullable(),
});

const serviceSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  quantity: z.number().positive(),
  unitPrice: z.number().min(0),
  discount: z.number().min(0).optional(),
  lineTotal: z.number().min(0),
});

const sectionsSchema = z.object({
  introduction: z.string().optional().default(""),
  object: z.string().optional().default(""),
  products: z.string().optional().default(""),
  schedule: z.string().optional().default(""),
  access_logistics: z.string().optional().default(""),
  transport: z.string().optional().default(""),
  setup_teardown: z.string().optional().default(""),
  payments: z.string().optional().default(""),
  deposit_terms: z.string().optional().default(""),
  installments_terms: z.string().optional().default(""),
  reschedule: z.string().optional().default(""),
  liability: z.string().optional().default(""),
  provider_obligations: z.string(),
  client_obligations: z.string(),
  delivery: z.string(),
  cancellation: z.string(),
  force_majeure: z.string(),
  copyright: z.string(),
  privacy: z.string(),
  special_clauses: z.string().optional().default(""),
  notes: z.string().optional().default(""),
});

const customSectionSchema = z.object({
  id: z.string().min(1),
  title: z.string().trim().min(1).max(200),
  content: z.string(),
  sortOrder: z.number().int().min(0),
  isRequired: z.boolean().optional(),
});

const updateContractSchema = z.object({
  contractId: z.string().uuid(),
  title: z.string().trim().min(2).max(200),
  currency: z.string().trim().min(3).max(8).default("RON"),
  eventDate: z.string().nullable().optional(),
  eventLocation: z.string().nullable().optional(),
  validUntil: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  subtotal: z.number().min(0),
  discountAmount: z.number().min(0).default(0),
  taxAmount: z.number().min(0).default(0),
  total: z.number().min(0),
  depositAmount: z.number().min(0),
  provider: partySchema,
  client: partySchema,
  services: z.array(serviceSchema).min(1),
  sections: sectionsSchema,
  customSections: z.array(customSectionSchema).optional().default([]),
  installments: z
    .array(
      z.object({
        label: z.string(),
        amount: z.number().min(0),
        dueDate: z.string().nullable().optional(),
      }),
    )
    .optional()
    .default([]),
});

const acceptSchema = z.object({
  token: z.string().min(24),
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email(),
  acceptedTerms: z.literal(true),
  acceptedPrivacy: z.literal(true),
  documentHash: z.string().optional().nullable(),
});

function asJson(value: unknown): Json {
  return value as Json;
}

function templateValuesFromContract(input: {
  clientName: string;
  clientEmail?: string | null;
  clientPhone?: string | null;
  companyName: string;
  companyEmail?: string | null;
  companyPhone?: string | null;
  eventDate?: string | null;
  eventLocation?: string | null;
  contractNumber?: string | null;
  proposalNumber?: string | null;
  total: number;
  deposit: number;
  remaining: number;
  currency: string;
}): TemplateVariableValues {
  return {
    client_name: input.clientName,
    client_email: input.clientEmail ?? "",
    client_phone: input.clientPhone ?? "",
    company_name: input.companyName,
    company_email: input.companyEmail ?? "",
    company_phone: input.companyPhone ?? "",
    event_date: input.eventDate ?? "",
    event_location: input.eventLocation ?? "",
    contract_number: input.contractNumber ?? "",
    proposal_number: input.proposalNumber ?? "",
    total: String(input.total),
    deposit: String(input.deposit),
    remaining: String(input.remaining),
    currency: input.currency,
  };
}

export async function updateContractDraftAction(
  input: unknown,
): Promise<ActionResult<{ contractId: string }>> {
  const parsed = updateContractSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  try {
    const ctx = await requireWorkspaceAction("contracts.write");
    const data = parsed.data;

    const { data: existing } = await ctx.supabase
      .from("contracts")
      .select("*")
      .eq("id", data.contractId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!existing) return actionError("Contractul nu a fost găsit.");

    const effective = getEffectiveContractStatus({
      status: existing.status,
      validUntil: existing.valid_until,
      publicTokenExpiresAt: existing.public_token_expires_at,
      acceptedAt: existing.accepted_at,
    });

    if (!canEditContract(effective)) {
      return actionError("Doar contractele draft pot fi editate liber.");
    }

    let money;
    try {
      money = computeContractMoney({
        subtotal: data.subtotal,
        discountAmount: data.discountAmount,
        taxAmount: data.taxAmount,
        total: data.total,
        depositAmount: data.depositAmount,
      });
    } catch {
      return actionError("Valorile financiare sunt invalide.");
    }

    const content: ContractContent = {
      provider: {
        ...data.provider,
        email: data.provider.email || null,
      },
      client: {
        ...data.client,
        email: data.client.email || null,
      },
      services: data.services as ContractServiceItem[],
      installments: data.installments,
      sections: { ...DEFAULT_CONTRACT_SECTIONS, ...data.sections } as ContractSections,
      customSections: data.customSections,
      eventLocation: data.eventLocation ?? null,
    };

    const { data: updated, error } = await ctx.supabase
      .from("contracts")
      .update({
        title: data.title,
        currency: data.currency,
        event_date: data.eventDate || null,
        event_location: data.eventLocation || null,
        valid_until: data.validUntil || null,
        terms: data.terms || null,
        subtotal: money.subtotal,
        discount_amount: money.discountAmount,
        tax_amount: money.taxAmount,
        total: money.total,
        deposit_amount: money.depositAmount,
        remaining_amount: money.remainingAmount,
        amount: money.total,
        deposit: money.depositAmount,
        content: asJson(content),
        client_id: existing.client_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.contractId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .eq("status", "draft")
      .select("id")
      .maybeSingle();

    if (error) {
      if (process.env.NODE_ENV === "development") console.error("[contracts.update]", error.message);
      return actionError("Nu am putut salva contractul.");
    }

    if (!updated) {
      return actionError("Doar contractele draft pot fi editate liber.");
    }

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "contract",
      entityId: data.contractId,
      action: "contract.updated",
      title: "Contract draft actualizat",
    });

    revalidatePath("/dashboard/contracts");
    revalidatePath(`/dashboard/contracts/${data.contractId}`);
    revalidatePath(`/dashboard/contracts/${data.contractId}/edit`);
    return actionSuccess("Contract salvat.", { contractId: data.contractId });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a modifica contracte.");
    }
    return actionError("Nu am putut salva contractul.");
  }
}

export async function publishContractAction(
  contractId: string,
): Promise<ActionResult<{ publicUrlPath: string; unresolved?: string[] }>> {
  try {
    const ctx = await requireWorkspaceAction("contracts.write");

    const { data: contract } = await ctx.supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!contract) return actionError("Contractul nu a fost găsit.");

    const effective = getEffectiveContractStatus({
      status: contract.status,
      validUntil: contract.valid_until,
      publicTokenExpiresAt: contract.public_token_expires_at,
      acceptedAt: contract.accepted_at,
    });

    if (!canPublishContract(effective)) {
      return actionError("Doar contractele draft pot fi publicate.");
    }

    const content = parseContractContent(contract.content);
    if (!content) return actionError("Completează conținutul contractului.");
    if (!content.provider.name.trim()) return actionError("Datele furnizorului sunt obligatorii.");
    if (!content.client.name.trim()) return actionError("Datele clientului sunt obligatorii.");
    if (!content.client.email && !content.client.phone) {
      return actionError("Adaugă email sau telefon pentru client.");
    }
    if (!content.services.length) return actionError("Adaugă cel puțin un serviciu.");
    if (!contract.title.trim()) return actionError("Titlul este obligatoriu.");
    if (!contract.terms?.trim() && !content.sections.provider_obligations.trim()) {
      return actionError("Clauzele / termenii sunt obligatorii.");
    }
    if (!contract.valid_until) {
      return actionError("Setează termenul de acceptare (valid until).");
    }

    let money;
    try {
      money = computeContractMoney({
        subtotal: Number(contract.subtotal),
        discountAmount: Number(contract.discount_amount),
        taxAmount: Number(contract.tax_amount),
        total: Number(contract.total),
        depositAmount: Number(contract.deposit_amount),
      });
    } catch {
      return actionError("Valorile financiare sunt invalide.");
    }
    if (money.total <= 0) return actionError("Totalul trebuie să fie pozitiv.");

    let proposalNumber: string | null = null;
    if (contract.proposal_id) {
      const { data: proposal } = await ctx.supabase
        .from("proposals")
        .select("proposal_number")
        .eq("id", contract.proposal_id)
        .maybeSingle();
      proposalNumber = proposal?.proposal_number ?? null;
    }

    let contractNumber = contract.contract_number;
    if (!contractNumber) {
      const { data: numberData, error: numberError } = await ctx.supabase.rpc(
        "next_contract_number",
        { p_workspace_id: ctx.activeWorkspace.id },
      );
      if (numberError || !numberData) {
        return actionError("Nu am putut genera numărul contractului.");
      }
      contractNumber = numberData;
    }

    const values = templateValuesFromContract({
      clientName: content.client.name,
      clientEmail: content.client.email,
      clientPhone: content.client.phone,
      companyName: content.provider.name,
      companyEmail: content.provider.email,
      companyPhone: content.provider.phone,
      eventDate: contract.event_date,
      eventLocation: contract.event_location ?? content.eventLocation,
      contractNumber,
      proposalNumber,
      total: money.total,
      deposit: money.depositAmount,
      remaining: money.remainingAmount,
      currency: contract.currency,
    });

    const textsToResolve = [
      contract.terms ?? "",
      content.sections.provider_obligations,
      content.sections.client_obligations,
      content.sections.delivery,
      content.sections.cancellation,
      content.sections.force_majeure,
      content.sections.copyright,
      content.sections.privacy,
      content.sections.special_clauses,
      content.sections.notes ?? "",
    ];

    const unresolvedCritical = hasUnresolvedCriticalPlaceholders(textsToResolve, values);
    if (unresolvedCritical.length) {
      return actionError(
        `Placeholder-uri critice nerezolvate: ${unresolvedCritical.map((v) => `{{${v}}}`).join(", ")}`,
      );
    }

    const resolvedSections: ContractSections = {
      ...content.sections,
      provider_obligations: resolveTemplateVariables(
        content.sections.provider_obligations,
        values,
      ).text,
      client_obligations: resolveTemplateVariables(content.sections.client_obligations, values)
        .text,
      delivery: resolveTemplateVariables(content.sections.delivery, values).text,
      cancellation: resolveTemplateVariables(content.sections.cancellation, values).text,
      force_majeure: resolveTemplateVariables(content.sections.force_majeure, values).text,
      copyright: resolveTemplateVariables(content.sections.copyright, values).text,
      privacy: resolveTemplateVariables(content.sections.privacy, values).text,
      special_clauses: resolveTemplateVariables(content.sections.special_clauses, values).text,
      notes: resolveTemplateVariables(content.sections.notes ?? "", values).text,
    };

    const resolvedTerms = resolveTemplateVariables(contract.terms ?? "", values).text;
    const resolvedContent: ContractContent = {
      ...content,
      sections: resolvedSections,
    };

    const snapshot = buildContractSnapshot({
      content: resolvedContent,
      money,
      currency: contract.currency,
      title: contract.title,
      terms: resolvedTerms,
      eventDate: contract.event_date,
      eventLocation: contract.event_location ?? content.eventLocation ?? null,
      contractNumber,
      version: contract.version,
      proposalId: contract.proposal_id,
      proposalNumber,
      source: "publish",
    });

    const token = generateContractPublicToken();
    const tokenHash = hashPublicToken(token);
    const expiresAt = contract.valid_until
      ? new Date(`${contract.valid_until}T23:59:59.000Z`).toISOString()
      : null;

    const { error } = await ctx.supabase
      .from("contracts")
      .update({
        status: "published",
        contract_number: contractNumber,
        public_token: token,
        public_token_hash: tokenHash,
        public_token_expires_at: expiresAt,
        published_at: new Date().toISOString(),
        content: asJson(resolvedContent),
        terms: resolvedTerms,
        snapshot: asJson(snapshot),
        contract_content_hash: snapshot.contract_content_hash,
        subtotal: money.subtotal,
        discount_amount: money.discountAmount,
        tax_amount: money.taxAmount,
        total: money.total,
        deposit_amount: money.depositAmount,
        remaining_amount: money.remainingAmount,
        amount: money.total,
        deposit: money.depositAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .eq("status", "draft");

    if (error) {
      if (process.env.NODE_ENV === "development") console.error("[contracts.publish]", error.message);
      return actionError("Nu am putut publica contractul.");
    }

    if (contract.previous_contract_id) {
      await ctx.supabase
        .from("contracts")
        .update({
          status: "superseded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", contract.previous_contract_id)
        .eq("workspace_id", ctx.activeWorkspace.id)
        .neq("status", "accepted");

      // Accepted previous stays accepted for legal archive; mark superseded only if not accepted
      // Spec: mark old superseded after new publishes — also for accepted? Spec says
      // "poate marca versiunea veche superseded doar după publicarea celei noi"
      // So we supersede even accepted for lineage, but acceptance record remains.
      await ctx.supabase
        .from("contracts")
        .update({
          status: "superseded",
          updated_at: new Date().toISOString(),
        })
        .eq("id", contract.previous_contract_id)
        .eq("workspace_id", ctx.activeWorkspace.id);

      await logActivity(ctx.supabase, {
        workspaceId: ctx.activeWorkspace.id,
        actorId: ctx.user.id,
        entityType: "contract",
        entityId: contract.previous_contract_id,
        action: "contract.superseded",
        title: "Contract înlocuit de versiune nouă",
        metadata: { next_contract_id: contractId },
      });
    }

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "contract",
      entityId: contractId,
      action: "contract.published",
      title: "Contract publicat",
      description: "Link public generat.",
      metadata: { contract_number: contractNumber, version: contract.version },
    });

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "contract",
      entityId: contractId,
      action: "contract.link_generated",
      title: "Link public contract",
      metadata: { has_token: true },
    });

    // Fire-and-forget: automation failures must never break contract publishing.
    try {
      await runAutomationsForTrigger({
        supabase: ctx.supabase,
        workspaceId: ctx.activeWorkspace.id,
        triggerKey: "contract_published",
        entityId: contractId,
        actorId: ctx.user.id,
        metadata: {
          contractNumber,
          total: money.total,
          currency: contract.currency,
          clientId: contract.client_id,
        },
        idempotencyKey: `contract_published:${contractId}:${contractNumber}`,
      });
    } catch (automationError) {
      if (process.env.NODE_ENV === "development") {
        console.error("[automations.contract_published]", automationError);
      }
    }

    revalidatePath("/dashboard/contracts");
    revalidatePath(`/dashboard/contracts/${contractId}`);
    return actionSuccess("Contract publicat.", { publicUrlPath: `/c/${token}` });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a publica contracte.");
    }
    return actionError("Nu am putut publica contractul.");
  }
}

export async function cancelContractAction(contractId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("contracts.write");

    const { data: contract } = await ctx.supabase
      .from("contracts")
      .select("id, status, valid_until, public_token_expires_at, accepted_at")
      .eq("id", contractId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!contract) return actionError("Contractul nu a fost găsit.");

    const effective = getEffectiveContractStatus({
      status: contract.status,
      validUntil: contract.valid_until,
      publicTokenExpiresAt: contract.public_token_expires_at,
      acceptedAt: contract.accepted_at,
    });
    if (!canCancelContract(effective)) {
      return actionError("Contractul nu poate fi anulat.");
    }

    const { error } = await ctx.supabase
      .from("contracts")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", contractId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut anula contractul.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "contract",
      entityId: contractId,
      action: "contract.cancelled",
      title: "Contract anulat",
    });

    revalidatePath("/dashboard/contracts");
    revalidatePath(`/dashboard/contracts/${contractId}`);
    return actionSuccess("Contract anulat.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a anula contracte.");
    }
    return actionError("Nu am putut anula contractul.");
  }
}

export async function duplicateContractAction(
  contractId: string,
): Promise<ActionResult<{ contractId: string }>> {
  try {
    const ctx = await requireWorkspaceAction("contracts.write");

    const { data: source } = await ctx.supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!source) return actionError("Contractul nu a fost găsit.");

    const { data: created, error } = await ctx.supabase
      .from("contracts")
      .insert({
        workspace_id: ctx.activeWorkspace.id,
        client_id: source.client_id,
        lead_id: source.lead_id,
        proposal_id: source.proposal_id,
        title: `${source.title} (copie)`,
        status: "draft",
        currency: source.currency,
        subtotal: source.subtotal,
        discount_amount: source.discount_amount,
        tax_amount: source.tax_amount,
        total: source.total,
        deposit_amount: source.deposit_amount,
        remaining_amount: source.remaining_amount,
        amount: source.total,
        deposit: source.deposit_amount,
        event_date: source.event_date,
        event_location: source.event_location,
        valid_until: source.valid_until,
        terms: source.terms,
        content: source.content,
        created_by: ctx.user.id,
        version: 1,
      })
      .select("id")
      .single();

    if (error || !created) return actionError("Nu am putut duplica contractul.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "contract",
      entityId: created.id,
      action: "contract.duplicated",
      title: "Contract duplicat",
      metadata: { source_id: contractId },
    });

    revalidatePath("/dashboard/contracts");
    return actionSuccess("Contract duplicat.", { contractId: created.id });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a duplica contracte.");
    }
    return actionError("Nu am putut duplica contractul.");
  }
}

export async function createContractVersionAction(
  contractId: string,
): Promise<ActionResult<{ contractId: string }>> {
  try {
    const ctx = await requireWorkspaceAction("contracts.write");

    const { data: source } = await ctx.supabase
      .from("contracts")
      .select("*")
      .eq("id", contractId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!source) return actionError("Contractul nu a fost găsit.");

    const effective = getEffectiveContractStatus({
      status: source.status,
      validUntil: source.valid_until,
      publicTokenExpiresAt: source.public_token_expires_at,
      acceptedAt: source.accepted_at,
    });

    if (!canCreateNewVersion(effective)) {
      return actionError("Nu poți crea o versiune nouă din acest status.");
    }

    const { data: created, error } = await ctx.supabase
      .from("contracts")
      .insert({
        workspace_id: ctx.activeWorkspace.id,
        client_id: source.client_id,
        lead_id: source.lead_id,
        proposal_id: source.proposal_id,
        title: source.title,
        status: "draft",
        currency: source.currency,
        subtotal: source.subtotal,
        discount_amount: source.discount_amount,
        tax_amount: source.tax_amount,
        total: source.total,
        deposit_amount: source.deposit_amount,
        remaining_amount: source.remaining_amount,
        amount: source.total,
        deposit: source.deposit_amount,
        event_date: source.event_date,
        event_location: source.event_location,
        valid_until: source.valid_until,
        terms: source.terms,
        content: source.content ?? asJson({ sections: DEFAULT_CONTRACT_SECTIONS }),
        previous_contract_id: source.id,
        created_by: ctx.user.id,
        version: (source.version ?? 1) + 1,
      })
      .select("id")
      .single();

    if (error || !created) return actionError("Nu am putut crea versiunea nouă.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "contract",
      entityId: created.id,
      action: "contract.version_created",
      title: "Versiune nouă contract",
      metadata: { previous_contract_id: source.id, version: (source.version ?? 1) + 1 },
    });

    revalidatePath("/dashboard/contracts");
    return actionSuccess("Versiune nouă creată ca draft.", { contractId: created.id });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a crea versiuni.");
    }
    return actionError("Nu am putut crea versiunea nouă.");
  }
}

export async function createPortalTokenAction(
  clientId: string,
): Promise<ActionResult<{ portalUrlPath: string }>> {
  try {
    const ctx = await requireWorkspaceAction("contracts.write");

    const { data: client } = await ctx.supabase
      .from("clients")
      .select("id")
      .eq("id", clientId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!client) return actionError("Clientul nu a fost găsit.");

    const token = generatePortalToken();
    const tokenHash = hashPublicToken(token);

    const { error } = await ctx.supabase.from("client_portal_tokens").insert({
      workspace_id: ctx.activeWorkspace.id,
      client_id: clientId,
      token_hash: tokenHash,
      created_by: ctx.user.id,
      expires_at: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
    });

    if (error) return actionError("Nu am putut genera tokenul de portal.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "client",
      entityId: clientId,
      action: "portal.token_created",
      title: "Token portal client generat",
      metadata: { has_token: true },
    });

    return actionSuccess("Link portal generat.", { portalUrlPath: `/portal/${token}` });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a genera portal.");
    }
    return actionError("Nu am putut genera portalul.");
  }
}

export async function acceptPublicContractAction(input: unknown): Promise<ActionResult> {
  const parsed = acceptSchema.safeParse(input);
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

  const { data, error } = await supabase.rpc("accept_contract_by_token", {
    p_token: parsed.data.token,
    p_full_name: parsed.data.fullName,
    p_email: parsed.data.email,
    p_accepted_terms: parsed.data.acceptedTerms,
    p_accepted_privacy: parsed.data.acceptedPrivacy,
    p_document_hash: parsed.data.documentHash ?? null,
    p_ip: ip,
    p_user_agent: userAgent,
  });

  if (error) {
    const msg = error.message || "";
    if (msg.includes("rate_limited")) return actionError("Prea multe încercări. Încearcă mai târziu.");
    if (msg.includes("contract_expired")) return actionError("Contractul a expirat.");
    if (msg.includes("contract_not_acceptable")) {
      return actionError("Contractul nu poate fi acceptat.");
    }
    if (msg.includes("hash_mismatch")) {
      return actionError("Documentul afișat nu mai corespunde. Reîncarcă pagina.");
    }
    if (msg.includes("terms_required") || msg.includes("privacy_required")) {
      return actionError("Trebuie să accepți termenii și politica de confidențialitate.");
    }
    return actionError("Nu am putut înregistra acceptarea.");
  }

  const payload = data as { ok?: boolean; already?: boolean } | null;
  if (payload?.already) {
    return actionSuccess("Contractul era deja acceptat.");
  }

  try {
    const admin = createAdminClient();
    const tokenHash = hashPublicToken(parsed.data.token);
    const { data: contract } = await admin
      .from("contracts")
      .select("id, title, workspace_id")
      .eq("public_token_hash", tokenHash)
      .maybeSingle();
    if (contract) {
      void notifyContractAccepted(admin, contract.workspace_id, {
        id: contract.id,
        title: contract.title,
      });
    }
  } catch (notifyError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[contracts.accept.notify]", notifyError);
    }
  }

  return actionSuccess("Contract acceptat digital.");
}

const createContractSchema = z.object({
  title: z.string().trim().min(2).max(200).default("Contract nou"),
  clientId: z.string().uuid().optional().nullable(),
  currency: z.string().trim().min(3).max(8).optional(),
  eventDate: z.string().nullable().optional(),
  eventLocation: z.string().nullable().optional(),
});

export async function createContractAction(
  input: unknown = {},
): Promise<ActionResult<{ contractId: string }>> {
  const parsed = createContractSchema.safeParse(input ?? {});
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  try {
    const ctx = await requireWorkspaceAction("contracts.write");
    const usage = await getUsageForWorkspace(ctx.supabase, ctx.activeWorkspace.id);
    const limitCheck = canCreateResource(usage.plan, "contract", usage);
    if (!limitCheck.ok) {
      return actionError(limitCheck.reason);
    }

    const data = parsed.data;
    const currency = data.currency?.trim() || ctx.activeWorkspace.currency || "RON";

    let clientName = "Client";
    let clientEmail: string | null = null;
    let clientPhone: string | null = null;
    if (data.clientId) {
      const { data: client } = await ctx.supabase
        .from("clients")
        .select("id, name, email, phone")
        .eq("id", data.clientId)
        .eq("workspace_id", ctx.activeWorkspace.id)
        .is("deleted_at", null)
        .maybeSingle();
      if (!client) return actionError("Clientul nu a fost găsit.");
      clientName = client.name;
      clientEmail = client.email;
      clientPhone = client.phone;
    }

    const content: ContractContent = {
      provider: {
        name: ctx.activeWorkspace.name,
        email: null,
        phone: null,
      },
      client: {
        name: clientName,
        email: clientEmail,
        phone: clientPhone,
      },
      services: [
        {
          name: "Serviciu",
          quantity: 1,
          unitPrice: 0,
          lineTotal: 0,
        },
      ],
      installments: [],
      sections: { ...DEFAULT_CONTRACT_SECTIONS },
      customSections: [],
      eventLocation: data.eventLocation ?? null,
    };

    const { data: created, error } = await ctx.supabase
      .from("contracts")
      .insert({
        workspace_id: ctx.activeWorkspace.id,
        client_id: data.clientId ?? null,
        title: data.title,
        status: "draft",
        currency,
        subtotal: 0,
        discount_amount: 0,
        tax_amount: 0,
        total: 0,
        deposit_amount: 0,
        remaining_amount: 0,
        amount: 0,
        deposit: 0,
        event_date: data.eventDate ?? null,
        event_location: data.eventLocation ?? null,
        content: asJson(content),
        terms: null,
        created_by: ctx.user.id,
        version: 1,
      })
      .select("id")
      .single();

    if (error || !created) {
      if (process.env.NODE_ENV === "development") {
        console.error("[contracts.create]", error?.message);
      }
      return actionError("Nu am putut crea contractul.");
    }

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "contract",
      entityId: created.id,
      action: "contract.created",
      title: "Contract draft creat",
      description: data.title,
    });

    revalidatePath("/dashboard/contracts");
    revalidatePath(`/dashboard/contracts/${created.id}`);
    revalidatePath(`/dashboard/contracts/${created.id}/edit`);
    return actionSuccess("Contract draft creat.", { contractId: created.id });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a crea contracte.");
    }
    return actionError("Nu am putut crea contractul.");
  }
}

export async function softDeleteContractAction(
  contractId: string,
): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("contracts.delete");

    const { data: existing } = await ctx.supabase
      .from("contracts")
      .select("id, title, status, accepted_at")
      .eq("id", contractId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!existing) return actionError("Contractul nu a fost găsit.");
    if (existing.status === "accepted" || existing.accepted_at) {
      return actionError("Contractul acceptat nu poate fi șters. Folosește arhivarea.");
    }
    if (existing.status !== "draft" && existing.status !== "cancelled") {
      return actionError("Doar drafturile sau contractele anulate pot fi șterse. Preferă anularea.");
    }

    const { error } = await ctx.supabase
      .from("contracts")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", contractId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut șterge contractul.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "contract",
      entityId: contractId,
      action: "contract.deleted",
      title: "Contract șters (soft)",
      description: existing.title,
    });

    revalidatePath("/dashboard/contracts");
    return actionSuccess("Contract șters.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a șterge contracte.");
    }
    return actionError("Nu am putut șterge contractul.");
  }
}

export async function archiveContractAction(contractId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("contracts.write");

    const { data: existing } = await ctx.supabase
      .from("contracts")
      .select("id, title, status")
      .eq("id", contractId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .maybeSingle();

    if (!existing) return actionError("Contractul nu a fost găsit.");

    const { error } = await ctx.supabase
      .from("contracts")
      .update({ archived_at: new Date().toISOString() })
      .eq("id", contractId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut arhiva contractul.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "contract",
      entityId: contractId,
      action: "contract.archived",
      title: "Contract arhivat",
      description: existing.title,
    });

    revalidatePath("/dashboard/contracts");
    revalidatePath(`/dashboard/contracts/${contractId}`);
    return actionSuccess("Contract arhivat.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a arhiva contracte.");
    }
    return actionError("Nu am putut arhiva contractul.");
  }
}

export async function restoreContractAction(contractId: string): Promise<ActionResult> {
  try {
    const ctx = await requireWorkspaceAction("contracts.write");

    const { data: existing } = await ctx.supabase
      .from("contracts")
      .select("id, title, deleted_at, archived_at")
      .eq("id", contractId)
      .eq("workspace_id", ctx.activeWorkspace.id)
      .maybeSingle();

    if (!existing) return actionError("Contractul nu a fost găsit.");

    const { error } = await ctx.supabase
      .from("contracts")
      .update({ deleted_at: null, archived_at: null })
      .eq("id", contractId)
      .eq("workspace_id", ctx.activeWorkspace.id);

    if (error) return actionError("Nu am putut restaura contractul.");

    await logActivity(ctx.supabase, {
      workspaceId: ctx.activeWorkspace.id,
      actorId: ctx.user.id,
      entityType: "contract",
      entityId: contractId,
      action: "contract.restored",
      title: "Contract restaurat",
      description: existing.title,
    });

    revalidatePath("/dashboard/contracts");
    revalidatePath(`/dashboard/contracts/${contractId}`);
    return actionSuccess("Contract restaurat.");
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a restaura contracte.");
    }
    return actionError("Nu am putut restaura contractul.");
  }
}

export async function convertProposalToContractRpc(
  proposalId: string,
): Promise<ActionResult<{ contractId: string }>> {
  try {
    const ctx = await requireWorkspaceAction("contracts.write");
    const { data, error } = await ctx.supabase.rpc("create_contract_from_proposal", {
      p_proposal_id: proposalId,
    });

    if (error || !data) {
      const msg = error?.message || "";
      if (msg.includes("proposal_not_accepted")) {
        return actionError("Doar ofertele acceptate pot fi convertite.");
      }
      if (msg.includes("forbidden")) {
        return actionError("Nu ai permisiunea de a crea contracte.");
      }
      return actionError("Nu am putut crea contractul.");
    }

    const contractId = typeof data === "string" ? data : String(data);
    if (!/^[0-9a-f-]{36}$/i.test(contractId)) {
      return actionError("Contractul a fost creat, dar ID-ul returnat este invalid.");
    }

    revalidatePath("/dashboard/proposals");
    revalidatePath(`/dashboard/proposals/${proposalId}`);
    revalidatePath("/dashboard/contracts");
    revalidatePath(`/dashboard/contracts/${contractId}`);
    revalidatePath(`/dashboard/contracts/${contractId}/edit`);
    return actionSuccess("Contract draft creat.", { contractId });
  } catch (error) {
    if (error instanceof Error && error.message === "forbidden") {
      return actionError("Nu ai permisiunea de a crea contracte.");
    }
    return actionError("Nu am putut crea contractul.");
  }
}
