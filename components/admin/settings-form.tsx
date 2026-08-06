"use client";

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
        <h3 className="font-heading text-base font-medium text-foreground">Mentenanță</h3>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={maintEnabled}
            onChange={(e) => setMaintEnabled(e.target.checked)}
          />
          Mod mentenanță activ
        </label>
        <div className="space-y-1.5">
          <Label htmlFor="maint-message">Mesaj</Label>
          <Input
            id="maint-message"
            value={maintMessage}
            onChange={(e) => setMaintMessage(e.target.value)}
            placeholder="Mesaj afișat utilizatorilor…"
          />
        </div>
        <AdminConfirmDialog
          trigger={
            <Button type="button" size="sm">
              Salvează mentenanța
            </Button>
          }
          title="Actualizează mentenanța"
          description="Setarea maintenance va fi scrisă în platform_settings."
          confirmLabel="Salvează"
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
        <h3 className="font-heading text-base font-medium text-foreground">Înregistrare</h3>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={regEnabled}
            onChange={(e) => setRegEnabled(e.target.checked)}
          />
          Înregistrare activă
        </label>
        <label className="inline-flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={inviteOnly}
            onChange={(e) => setInviteOnly(e.target.checked)}
          />
          Doar pe invitație
        </label>
        <AdminConfirmDialog
          trigger={
            <Button type="button" size="sm">
              Salvează înregistrarea
            </Button>
          }
          title="Actualizează înregistrarea"
          description="Setarea registration va fi scrisă în platform_settings."
          confirmLabel="Salvează"
          onConfirm={(reason) =>
            save("registration", { enabled: regEnabled, inviteOnly }, reason)
          }
        />
      </div>
    </div>
  );
}
