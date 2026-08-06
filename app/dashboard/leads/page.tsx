import type { Metadata } from "next";

import { LeadsPageClient } from "@/components/leads/leads-page-client";
import { mapLeadRow } from "@/lib/crm/mappers";
import { listLeads } from "@/lib/data/leads";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Leaduri · EasyWedd Pro",
};

export default async function LeadsPage() {
  const ctx = await getWorkspaceOrDemo();

  let leads = [] as ReturnType<typeof mapLeadRow>[];
  let error: string | null = null;

  try {
    const result = await listLeads(ctx.supabase, { workspaceId: ctx.workspace.id });
    leads = result.leads.map(mapLeadRow);
  } catch (err) {
    error = err instanceof Error ? err.message : "Nu am putut încărca leadurile.";
  }

  return (
    <LeadsPageClient
      initialLeads={leads}
      mode="live"
      currency={ctx.workspace.currency}
      error={error}
    />
  );
}
