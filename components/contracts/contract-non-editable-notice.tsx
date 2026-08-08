"use client";

import { useI18n } from "@/components/providers/i18n-provider";

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
  const { t } = useI18n();
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

    toast(result?.success ?? t("modules.contracts.versionCreated"), "success");
    if (result?.data?.contractId) {
      router.push(`/dashboard/contracts/${result.data.contractId}?edit=1`);
    }
  }

  return (
    <div className="surface-card space-y-4 p-5">
      <p className="text-sm text-foreground">
        {t("modules.contracts.nonEditable")}
      </p>
      {canCreateVersion ? (
        <Button type="button" onClick={handleNewVersion} disabled={busy}>
          <Plus data-icon="inline-start" />
          {busy ? t("common.creating") : t("modules.contracts.createNewVersion")}
        </Button>
      ) : null}
    </div>
  );
}
