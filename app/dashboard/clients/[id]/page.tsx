import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ClientDetailTabs } from "@/components/dashboard/client-detail-tabs";
import { ModuleShell } from "@/components/shared/module-shell";
import { mapActivityRow, mapClientRow } from "@/lib/crm/mappers";
import { getClientActivity, getClientById } from "@/lib/data/clients";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

type ClientPageParams = { id: string };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Client · EasyWedd Pro",
  };
}

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<ClientPageParams>;
}) {
  const { id } = await params;
  const ctx = await getWorkspaceOrDemo();

  let clientRow;
  try {
    clientRow = await getClientById(ctx.supabase, ctx.workspace.id, id);
  } catch {
    notFound();
  }

  if (!clientRow) {
    notFound();
  }

  const activityRows = await getClientActivity(ctx.supabase, ctx.workspace.id, id);
  const client = mapClientRow(clientRow);
  const activity = activityRows.map(mapActivityRow);

  return (
    <ModuleShell
      title={client.name}
      description={`${client.eventType || "Client"}${client.city ? ` · ${client.city}` : ""}`}
    >
      <ClientDetailTabs
        client={client}
        projects={[]}
        contracts={[]}
        payments={[]}
        activity={activity}
        mode="live"
      />
    </ModuleShell>
  );
}
