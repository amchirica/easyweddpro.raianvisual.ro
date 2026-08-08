import type { Metadata } from "next";
import { getTranslator } from "@/lib/i18n/t";

import { ProposalsList, type ProposalListItem } from "@/components/proposals/proposals-list";
import { listProposals } from "@/lib/data/proposals";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: `${t("modules.proposals.title")} · EasyWedd Pro` };
}

type ProposalRowWithRelations = Awaited<ReturnType<typeof listProposals>>["proposals"][number];

function mapProposalRow(row: ProposalRowWithRelations): ProposalListItem {
  return {
    id: row.id,
    proposalNumber: row.proposal_number,
    title: row.title,
    clientName: row.clientName,
    leadName: row.leadName,
    total: Number(row.total),
    currency: row.currency,
    status: row.status,
    effectiveStatus: row.effectiveStatus,
    validUntil: row.valid_until,
    publicToken: row.public_token,
  };
}

export default async function ProposalsPage() {
  const { t } = await getTranslator();
  const ctx = await getWorkspaceOrDemo();

  const permissions = permissionsForRole(ctx.role);
  let proposals: ProposalListItem[] = [];
  let error: string | null = null;

  try {
    const result = await listProposals(ctx.supabase, { workspaceId: ctx.workspace.id, limit: 100 });
    proposals = result.proposals.map(mapProposalRow);
  } catch (err) {
    error = err instanceof Error ? err.message : t("modules.proposals.loadFailed");
  }

  return (
    <ProposalsList
      initialProposals={proposals}
      mode="live"
      canWrite={permissions.canWriteProposals}
      error={error}
    />
  );
}
