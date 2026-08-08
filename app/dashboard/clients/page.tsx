import type { Metadata } from "next";
import { getTranslator } from "@/lib/i18n/t";

import { ClientsPageClient } from "@/components/clients/clients-page-client";
import { mapClientRow, type ClientViewModel } from "@/lib/crm/mappers";
import { listClients } from "@/lib/data/clients";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: `${t("modules.clients.title")} · EasyWedd Pro` };
}

export default async function ClientsPage() {
  const { t } = await getTranslator();
  const ctx = await getWorkspaceOrDemo();

  let clients: ClientViewModel[] = [];
  let error: string | null = null;

  try {
    const rows = await listClients(ctx.supabase, ctx.workspace.id);
    clients = rows.map(mapClientRow);
  } catch (err) {
    error = err instanceof Error ? err.message : t("modules.clients.loadFailed");
  }

  return <ClientsPageClient initialClients={clients} mode="live" error={error} />;
}
