import type { Metadata } from "next";

import { ProposalsList, type ProposalListItem } from "@/components/proposals/proposals-list";
import { listProposals } from "@/lib/data/proposals";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Oferte · EasyWedd Pro",
};

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
  const ctx = await getWorkspaceOrDemo();

  const permissions = permissionsForRole(ctx.role);
  let proposals: ProposalListItem[] = [];
  let error: string | null = null;

  try {
    const result = await listProposals(ctx.supabase, { workspaceId: ctx.workspace.id, limit: 100 });
    proposals = result.proposals.map(mapProposalRow);
  } catch (err) {
    error = err instanceof Error ? err.message : "Nu am putut încărca ofertele.";
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
