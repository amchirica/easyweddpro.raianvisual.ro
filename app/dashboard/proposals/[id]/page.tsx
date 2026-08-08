import type { Metadata } from "next";
import { getTranslator } from "@/lib/i18n/t";
import { notFound } from "next/navigation";

import { ModuleShell } from "@/components/shared/module-shell";
import {
  ProposalDetail,
  type ProposalDetailData,
  type ProposalDetailItem,
} from "@/components/proposals/proposal-detail";
import { listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { getProposalById, getProposalItems, type ProposalItemRow } from "@/lib/data/proposals";
import { type DiscountType } from "@/lib/proposals/money";
import { getEffectiveProposalStatus } from "@/lib/proposals/status";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

type ProposalPageParams = { id: string };

type ProposalDetailRow = NonNullable<Awaited<ReturnType<typeof getProposalById>>>;

function mapProposalRowToDetail(row: ProposalDetailRow): ProposalDetailData {
  const client = row.clients as { id?: string; name?: string; email?: string | null } | null;
  const lead = row.leads as { id?: string; name?: string; email?: string | null } | null;

  return {
    id: row.id,
    proposalNumber: row.proposal_number,
    title: row.title,
    status: row.status,
    effectiveStatus: getEffectiveProposalStatus({
      status: row.status,
      validUntil: row.valid_until,
      publicTokenExpiresAt: row.public_token_expires_at,
      acceptedAt: row.accepted_at,
    }),
    currency: row.currency,
    subtotal: Number(row.subtotal),
    discountType: (row.discount_type as DiscountType) ?? "none",
    discountValue: Number(row.discount_value),
    discountAmount: Number(row.discount_amount),
    taxRate: Number(row.tax_rate),
    taxAmount: Number(row.tax_amount),
    total: Number(row.total),
    validUntil: row.valid_until,
    notes: row.notes,
    terms: row.terms,
    publicToken: row.public_token,
    contractId: row.contract_id,
    clientId: row.client_id,
    clientName: client?.name ?? null,
    leadId: row.lead_id,
    leadName: lead?.name ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapItemRow(row: ProposalItemRow): ProposalDetailItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    quantity: Number(row.quantity),
    unitPrice: Number(row.unit_price),
    discount: Number(row.discount),
    lineTotal: Number(row.line_total),
  };
}

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    title: `${t("modules.proposals.singular")} · EasyWedd Pro`,
  };
}

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<ProposalPageParams>;
}) {
  const { t } = await getTranslator();
  const { id } = await params;
  const ctx = await getWorkspaceOrDemo();

  let row: ProposalDetailRow | null = null;
  try {
    row = await getProposalById(ctx.supabase, ctx.workspace.id, id);
  } catch {
    notFound();
  }

  if (!row) notFound();

  const [itemRows, clientRows, leadsResult] = await Promise.all([
    getProposalItems(ctx.supabase, ctx.workspace.id, id),
    listClients(ctx.supabase, ctx.workspace.id, { limit: 200 }),
    listLeads(ctx.supabase, { workspaceId: ctx.workspace.id, limit: 200 }),
  ]);

  const permissions = permissionsForRole(ctx.role);
  const proposal = mapProposalRowToDetail(row);
  const items = itemRows.map(mapItemRow);

  return (
    <ModuleShell title={proposal.title} description={proposal.proposalNumber ?? t("modules.proposals.singular")}>
      <ProposalDetail
        proposal={proposal}
        items={items}
        mode="live"
        canWrite={permissions.canWriteProposals}
        canDelete={permissions.canDeleteProposals}
        canWriteContracts={permissions.canWriteContracts}
        clients={clientRows.map((client) => ({ id: client.id, name: client.name }))}
        leads={leadsResult.leads.map((lead) => ({ id: lead.id, name: lead.name }))}
      />
    </ModuleShell>
  );
}
