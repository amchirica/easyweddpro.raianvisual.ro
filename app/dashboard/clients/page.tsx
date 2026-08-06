import type { Metadata } from "next";

import { ClientsPageClient } from "@/components/clients/clients-page-client";
import { mapClientRow, type ClientViewModel } from "@/lib/crm/mappers";
import { listClients } from "@/lib/data/clients";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Clienți · EasyWedd Pro",
};

export default async function ClientsPage() {
  const ctx = await getWorkspaceOrDemo();

  let clients: ClientViewModel[] = [];
  let error: string | null = null;

  try {
    const rows = await listClients(ctx.supabase, ctx.workspace.id);
    clients = rows.map(mapClientRow);
  } catch (err) {
    error = err instanceof Error ? err.message : "Nu am putut încărca clienții.";
  }

  return <ClientsPageClient initialClients={clients} mode="live" error={error} />;
}
