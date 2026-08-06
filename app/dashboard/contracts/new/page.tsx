import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { createContractAction } from "@/lib/actions/contracts";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";

export const metadata: Metadata = {
  title: "Contract nou · EasyWedd Pro",
};

export default async function NewContractPage() {
  try {
    await requireWorkspaceAction("contracts.write");
  } catch {
    redirect("/dashboard/contracts");
  }

  const result = await createContractAction({ title: "Contract nou" });
  if (result.error || !result.data?.contractId) {
    redirect("/dashboard/contracts");
  }

  redirect(`/dashboard/contracts/${result.data.contractId}/edit`);
}
