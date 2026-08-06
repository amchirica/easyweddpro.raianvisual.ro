"use client";

import { useRouter } from "next/navigation";

import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { resolveSystemErrorAction } from "@/lib/actions/platform-admin";

export function SystemErrorActions({ errorId }: { errorId: string }) {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <AdminConfirmDialog
      trigger={
        <Button type="button" size="xs" variant="outline">
          Marchează rezolvat
        </Button>
      }
      title="Rezolvă eroarea de sistem"
      description="Eroarea va fi marcată ca rezolvată. Poți adăuga o notă în motiv."
      confirmLabel="Rezolvă"
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
