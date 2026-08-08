"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { updatePlatformAdminRoleAction } from "@/lib/actions/platform-admin";
import { PLATFORM_ROLE_LABELS, PLATFORM_ROLES } from "@/lib/platform/roles";

export function AdminRoleActions({
  userId,
  currentRole,
  canWrite,
}: {
  userId: string;
  currentRole: string;
  canWrite: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [role, setRole] = useState(currentRole);

  if (!canWrite) {
    return (
      <span className="text-xs text-muted-soft">
        {PLATFORM_ROLE_LABELS[currentRole as keyof typeof PLATFORM_ROLE_LABELS] ?? currentRole}
      </span>
    );
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <div className="space-y-1">
        <Label htmlFor={`role-${userId}`}>Rol</Label>
        <select
          id={`role-${userId}`}
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="flex h-8 rounded-lg border border-border bg-background px-2 text-xs"
        >
          {PLATFORM_ROLES.map((r) => (
            <option key={r} value={r}>
              {PLATFORM_ROLE_LABELS[r]}
            </option>
          ))}
        </select>
      </div>
      <AdminConfirmDialog
        trigger={
          <Button type="button" size="xs" variant="outline">
            {t("common.update")}
          </Button>
        }
        title={t("admin.changeAdminRole")}
        description={t("admin.changeAdminRoleDesc")}
        confirmLabel={t("admin.saveRole")}
        onConfirm={async (reason) => {
          const result = await updatePlatformAdminRoleAction({
            userId,
            role,
            reason,
          });
          if (result?.error) throw new Error(result.error);
          toast(result?.success ?? "Rol actualizat.", "success");
          router.refresh();
        }}
      />
    </div>
  );
}
