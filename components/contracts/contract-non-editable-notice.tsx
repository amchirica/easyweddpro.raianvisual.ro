"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Plus } from "lucide-react";

import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { createContractVersionAction } from "@/lib/actions/contracts";

type ContractNonEditableNoticeProps = {
  contractId: string;
  canCreateVersion: boolean;
};

export function ContractNonEditableNotice({
  contractId,
  canCreateVersion,
}: ContractNonEditableNoticeProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  async function handleNewVersion() {
    setBusy(true);
    const result = await createContractVersionAction(contractId);
    setBusy(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }

    toast(result?.success ?? "Versiune nouă creată.", "success");
    if (result?.data?.contractId) {
      router.push(`/dashboard/contracts/${result.data.contractId}?edit=1`);
    }
  }

  return (
    <div className="surface-card space-y-4 p-5">
      <p className="text-sm text-foreground">
        Acest contract nu mai poate fi editat direct. Creează o versiune nouă pentru
        modificări.
      </p>
      {canCreateVersion ? (
        <Button type="button" onClick={handleNewVersion} disabled={busy}>
          <Plus data-icon="inline-start" />
          {busy ? "Se creează…" : "Creează versiune nouă"}
        </Button>
      ) : null}
    </div>
  );
}
