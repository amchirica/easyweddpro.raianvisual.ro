"use client";

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
              Reactivează
            </Button>
          }
          title="Reactivează utilizatorul"
          description="Contul va putea din nou să acceseze platforma."
          confirmLabel="Reactivează"
          onConfirm={(reason) =>
            run(() => reactivateUserAction({ userId, reason }))
          }
        />
      ) : (
        <AdminConfirmDialog
          trigger={
            <Button type="button" size="sm" variant="destructive">
              Suspendă
            </Button>
          }
          title="Suspendă utilizatorul"
          description="Contul nu va mai putea accesa platforma până la reactivare."
          confirmLabel="Suspendă"
          destructive
          onConfirm={(reason) =>
            run(() => suspendUserAction({ userId, reason }))
          }
        />
      )}
      <AdminConfirmDialog
        trigger={
          <Button type="button" size="sm" variant="outline">
            Reset parolă
          </Button>
        }
        title="Trimite resetare parolă"
        description="Utilizatorul va primi un email cu link de resetare a parolei."
        confirmLabel="Trimite email"
        onConfirm={(reason) =>
          run(() => sendPasswordResetAction({ userId, reason }))
        }
      />
    </AdminActionMenu>
  );
}
