import type { Metadata } from "next";
import { getTranslator } from "@/lib/i18n/t";

import { ContractsList, type ContractListItem } from "@/components/contracts/contracts-list";
import { listContracts } from "@/lib/data/contracts";
import { listClients } from "@/lib/data/clients";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: `${t("modules.contracts.title")} · EasyWedd Pro` };
}

type ContractRowWithMeta = Awaited<ReturnType<typeof listContracts>>["contracts"][number];

function mapContractRow(row: ContractRowWithMeta): ContractListItem {
  return {
    id: row.id,
    contractNumber: row.contract_number,
    title: row.title,
    clientName: row.clientName,
    clientId: row.client_id,
    total: Number(row.total),
    deposit: Number(row.deposit_amount),
    remaining: Number(row.remaining_amount),
    currency: row.currency,
    status: row.status,
    effectiveStatus: row.effectiveStatus,
    eventDate: row.event_date,
    updatedAt: row.updated_at,
    publicToken: row.public_token,
  };
}

export default async function ContractsPage() {
  const { t } = await getTranslator();
  const ctx = await requireWorkspace();
  const permissions = permissionsForRole(ctx.role);
  let contracts: ContractListItem[] = [];
  let clients: Array<{ id: string; name: string }> = [];
  let error: string | null = null;

  try {
    const [result, clientRows] = await Promise.all([
      listContracts(ctx.supabase, { workspaceId: ctx.activeWorkspace.id, limit: 100 }),
      listClients(ctx.supabase, ctx.activeWorkspace.id, { limit: 200 }),
    ]);
    contracts = result.contracts.map(mapContractRow);
    clients = clientRows.map((client) => ({ id: client.id, name: client.name }));
  } catch (err) {
    error = err instanceof Error ? err.message : t("modules.contracts.loadFailed");
  }

  return (
    <ContractsList
      initialContracts={contracts}
      mode="live"
      canWrite={permissions.canWriteContracts}
      clients={clients}
      error={error}
    />
  );
}
