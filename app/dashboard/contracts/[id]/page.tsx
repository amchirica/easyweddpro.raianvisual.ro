import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ContractDetail } from "@/components/contracts/contract-detail";
import { ModuleShell } from "@/components/shared/module-shell";
import { getContractByIdForWorkspace } from "@/lib/data/contracts";
import { mapContractRowToDetail } from "@/lib/contracts/map-detail";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";

type ContractPageParams = { id: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<ContractPageParams>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Contract · EasyWedd Pro",
    description: `Detaliu contract ${id}`,
  };
}

export default async function ContractDetailPage({
  params,
  searchParams,
}: {
  params: Promise<ContractPageParams>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const contractId = typeof id === "string" ? id.trim() : "";

  if (!contractId) {
    notFound();
  }

  const ctx = await requireWorkspace();

  let row;
  try {
    row = await getContractByIdForWorkspace(
      ctx.supabase,
      ctx.activeWorkspace.id,
      contractId,
    );
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[contracts.detail]", {
        contractId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    notFound();
  }

  if (!row) notFound();

  const permissions = permissionsForRole(ctx.role);
  const contract = mapContractRowToDetail(row as Parameters<typeof mapContractRowToDetail>[0]);
  const openEditor = query.edit === "1" || query.edit === "true";

  return (
    <ModuleShell title={contract.title} description={contract.contractNumber ?? "Contract"}>
      <ContractDetail
        contract={contract}
        mode="live"
        canWrite={permissions.canWriteContracts}
        openEditor={openEditor}
      />
    </ModuleShell>
  );
}
