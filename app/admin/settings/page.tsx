import { Settings } from "lucide-react";

import { AdminDetailPanel } from "@/components/admin/admin-detail-panel";
import { AdminEmptyState } from "@/components/admin/admin-empty-state";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { SettingsForm } from "@/components/admin/settings-form";
import { formatDateTime } from "@/lib/format";
import { canPerformPlatformAction } from "@/lib/platform/permissions";
import { requirePlatformPermission } from "@/lib/platform/session";

function asObject(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

export default async function AdminSettingsPage() {
  const admin = await requirePlatformPermission("settings.read");
  const canWrite = canPerformPlatformAction(admin.platformRole, "settings.write");

  const { data, error } = await admin.supabase
    .from("platform_settings")
    .select("key, value, updated_by, updated_at")
    .order("key", { ascending: true });

  const settings = data ?? [];
  const byKey = new Map(settings.map((row) => [row.key, row]));

  const maintenanceRaw = asObject(byKey.get("maintenance")?.value);
  const registrationRaw = asObject(byKey.get("registration")?.value);

  const maintenance = {
    enabled: Boolean(maintenanceRaw.enabled),
    message: typeof maintenanceRaw.message === "string" ? maintenanceRaw.message : null,
  };
  const registration = {
    enabled: registrationRaw.enabled !== false,
    inviteOnly: Boolean(registrationRaw.inviteOnly),
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Configurări</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Setări non-secrete din `platform_settings`.
        </p>
      </div>

      {error ? <AdminErrorState message={error.message} /> : null}

      {!error && settings.length === 0 ? (
        <AdminEmptyState
          icon={Settings}
          title="Nicio setare"
          description="Tabelul platform_settings este gol."
        />
      ) : null}

      {!error && settings.length > 0 ? (
        <AdminDetailPanel title="Chei existente">
          <ul className="divide-y divide-border">
            {settings.map((row) => (
              <li key={row.key} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div>
                  <p className="font-mono text-sm text-foreground">{row.key}</p>
                  <pre className="mt-1 max-w-xl overflow-x-auto rounded-lg bg-background/50 p-2 text-xs text-muted-foreground">
                    {JSON.stringify(row.value, null, 2)}
                  </pre>
                </div>
                <p className="text-xs text-muted-soft">{formatDateTime(row.updated_at)}</p>
              </li>
            ))}
          </ul>
        </AdminDetailPanel>
      ) : null}

      {canWrite ? (
        <AdminDetailPanel
          title="Actualizare rapidă"
          description="Editează mentenanța și înregistrarea. Necesită motiv în audit."
        >
          <SettingsForm maintenance={maintenance} registration={registration} />
        </AdminDetailPanel>
      ) : (
        <p className="text-sm text-muted-soft">
          Rolul tău permite doar citirea setărilor.
        </p>
      )}
    </div>
  );
}
