import { redirect, notFound } from "next/navigation";

import { requireWorkspace } from "@/lib/workspace/session";
import { getContractByIdForWorkspace } from "@/lib/data/contracts";

type EditPageParams = { id: string };

/**
 * Canonical edit URL redirects to the detail page editor.
 * This avoids nested-route / soft-404 issues while keeping bookmarks working.
 */
export default async function ContractEditPage({
  params,
}: {
  params: Promise<EditPageParams>;
}) {
  const { id } = await params;
  const contractId = typeof id === "string" ? id.trim() : "";

  if (!contractId) {
    notFound();
  }

  const ctx = await requireWorkspace();

  try {
    const row = await getContractByIdForWorkspace(
      ctx.supabase,
      ctx.activeWorkspace.id,
      contractId,
    );
    if (!row) {
      notFound();
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[contracts.edit]", {
        contractId,
        message: error instanceof Error ? error.message : String(error),
      });
    }
    notFound();
  }

  redirect(`/dashboard/contracts/${contractId}?edit=1`);
}
