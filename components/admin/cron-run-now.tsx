"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useRouter } from "next/navigation";

import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { runCronNowAction } from "@/lib/actions/platform-admin";

export function CronRunNowButton() {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();

  return (
    <AdminConfirmDialog
      trigger={
        <Button type="button" size="sm">
          {t("admin.runNow")}
        </Button>
      }
      title={t("admin.runJobsTitle")}
      description={t("admin.runJobsDesc")}
      confirmLabel={t("admin.run")}
      onConfirm={async (reason) => {
        const result = await runCronNowAction({ reason });
        if (result?.error) throw new Error(result.error);
        toast(result?.success ?? "Cron rulat.", "success");
        router.refresh();
      }}
    />
  );
}
