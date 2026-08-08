"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useRouter } from "next/navigation";

import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { resolveSystemErrorAction } from "@/lib/actions/platform-admin";

export function SystemErrorActions({ errorId }: { errorId: string }) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();

  return (
    <AdminConfirmDialog
      trigger={
        <Button type="button" size="xs" variant="outline">
          {t("admin.markResolved")}
        </Button>
      }
      title={t("admin.resolveErrorTitle")}
      description={t("admin.resolveErrorDesc")}
      confirmLabel={t("admin.resolve")}
      onConfirm={async (reason) => {
        const result = await resolveSystemErrorAction({
          errorId,
          notes: reason,
        });
        if (result?.error) throw new Error(result.error);
        toast(result?.success ?? "Eroare rezolvată.", "success");
        router.refresh();
      }}
    />
  );
}
