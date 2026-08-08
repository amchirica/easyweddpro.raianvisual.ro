"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePlatformSettingAction } from "@/lib/actions/platform-admin";

type MaintenanceValue = { enabled: boolean; message: string | null };
type RegistrationValue = { enabled: boolean; inviteOnly: boolean };

export function SettingsForm({
  maintenance,
  registration,
}: {
  maintenance: MaintenanceValue;
  registration: RegistrationValue;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [maintEnabled, setMaintEnabled] = useState(maintenance.enabled);
  const [maintMessage, setMaintMessage] = useState(maintenance.message ?? "");
  const [regEnabled, setRegEnabled] = useState(registration.enabled);
  const [inviteOnly, setInviteOnly] = useState(registration.inviteOnly);

  async function save(key: string, value: Record<string, unknown>, reason: string) {
    const result = await updatePlatformSettingAction({ key, value, reason });
    if (result?.error) throw new Error(result.error);
    toast(result?.success ?? "Setare actualizată.", "success");
    router.refresh();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4 rounded-xl border border-border p-4">
        <h3 className="font-heading text-base font-medium text-foreground">{t("admin.maintenance")}</h3>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={maintEnabled}
            onChange={(e) => setMaintEnabled(e.target.checked)}
          />
          {t("admin.maintenanceActive")}
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="maint-message">Mesaj</Label>
          <Input
            id="maint-message"
            value={maintMessage}
            onChange={(e) => setMaintMessage(e.target.value)}
            placeholder={t("admin.maintenanceMessagePh")}
          />
        </div>
        <AdminConfirmDialog
          trigger={
            <Button type="button" size="sm">
              {t("admin.saveMaintenance")}
            </Button>
          }
          title={t("admin.updateMaintenance")}
          description={t("admin.maintenanceDesc")}
          confirmLabel={t("common.save")}
          onConfirm={(reason) =>
            save(
              "maintenance",
              { enabled: maintEnabled, message: maintMessage.trim() || null },
              reason,
            )
          }
        />
      </div>

      <div className="space-y-4 rounded-xl border border-border p-4">
        <h3 className="font-heading text-base font-medium text-foreground">{t("admin.registration")}</h3>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={regEnabled}
            onChange={(e) => setRegEnabled(e.target.checked)}
          />
          {t("admin.registrationActive")}
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inviteOnly}
            onChange={(e) => setInviteOnly(e.target.checked)}
          />
          {t("admin.inviteOnly")}
        </label>
        <AdminConfirmDialog
          trigger={
            <Button type="button" size="sm">
              {t("admin.saveRegistration")}
            </Button>
          }
          title={t("admin.updateRegistration")}
          description={t("admin.registrationDesc")}
          confirmLabel={t("common.save")}
          onConfirm={(reason) =>
            save("registration", { enabled: regEnabled, inviteOnly }, reason)
          }
        />
      </div>
    </div>
  );
}
