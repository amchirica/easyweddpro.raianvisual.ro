"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useRouter } from "next/navigation";

import { AdminActionMenu } from "@/components/admin/admin-action-menu";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import {
  reactivateUserAction,
  sendPasswordResetAction,
  suspendUserAction,
} from "@/lib/actions/platform-admin";

export function UserActions({
  userId,
  accountStatus,
}: {
  userId: string;
  accountStatus: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const isSuspended = accountStatus === "suspended";

  async function run(
    action: () => Promise<{ error?: string; success?: string }>,
  ) {
    const result = await action();
    if (result?.error) throw new Error(result.error);
    toast(result?.success ?? "Actualizat.", "success");
    router.refresh();
  }

  return (
    <AdminActionMenu>
      {isSuspended ? (
        <AdminConfirmDialog
          trigger={
            <Button type="button" size="sm" variant="outline">
              {t("admin.reactivate")}
            </Button>
          }
          title={t("admin.reactivateUser")}
          description={t("admin.reactivateUserDesc")}
          confirmLabel={t("admin.reactivate")}
          onConfirm={(reason) =>
            run(() => reactivateUserAction({ userId, reason }))
          }
        />
      ) : (
        <AdminConfirmDialog
          trigger={
            <Button type="button" size="sm" variant="destructive">
              {t("admin.suspend")}
            </Button>
          }
          title={t("admin.suspendUser")}
          description={t("admin.suspendUserDesc")}
          confirmLabel={t("admin.suspend")}
          destructive
          onConfirm={(reason) =>
            run(() => suspendUserAction({ userId, reason }))
          }
        />
      )}
      <AdminConfirmDialog
        trigger={
          <Button type="button" size="sm" variant="outline">
            {t("admin.resetPassword")}
          </Button>
        }
        title={t("admin.sendPasswordReset")}
        description="Utilizatorul va primi un email cu link de resetare a parolei."
        confirmLabel={t("admin.sendEmail")}
        onConfirm={(reason) =>
          run(() => sendPasswordResetAction({ userId, reason }))
        }
      />
    </AdminActionMenu>
  );
}
