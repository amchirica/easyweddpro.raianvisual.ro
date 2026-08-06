"use client";

import { useRouter } from "next/navigation";

import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { runCronNowAction } from "@/lib/actions/platform-admin";

export function CronRunNowButton() {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <AdminConfirmDialog
      trigger={
        <Button type="button" size="sm">
          Rulează acum
        </Button>
      }
      title="Rulează joburile de background"
      description="Va executa runner-ul de cron imediat. Poate dura câteva secunde."
      confirmLabel="Rulează"
      onConfirm={async (reason) => {
        const result = await runCronNowAction({ reason });
        if (result?.error) throw new Error(result.error);
        toast(result?.success ?? "Cron rulat.", "success");
        router.refresh();
      }}
    />
  );
}
