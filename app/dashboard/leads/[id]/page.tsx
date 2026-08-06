import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LeadDetail } from "@/components/leads/lead-detail";
import { ModuleShell } from "@/components/shared/module-shell";
import { mapActivityRow, mapLeadRow } from "@/lib/crm/mappers";
import { getLeadActivity, getLeadById } from "@/lib/data/leads";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

type LeadPageParams = { id: string };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Lead · EasyWedd Pro",
  };
}

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<LeadPageParams>;
}) {
  const { id } = await params;
  const ctx = await getWorkspaceOrDemo();

  let leadRow;
  try {
    leadRow = await getLeadById(ctx.supabase, ctx.workspace.id, id);
  } catch {
    notFound();
  }

  if (!leadRow) {
    notFound();
  }

  const activityRows = await getLeadActivity(ctx.supabase, ctx.workspace.id, id);
  const lead = mapLeadRow(leadRow);
  const activity = activityRows.map(mapActivityRow);

  return (
    <ModuleShell
      title={lead.name}
      description={`${lead.eventType || "Lead"}${lead.city ? ` · ${lead.city}` : ""}`}
    >
      <LeadDetail lead={lead} activity={activity} mode="live" currency={ctx.workspace.currency} />
    </ModuleShell>
  );
}
