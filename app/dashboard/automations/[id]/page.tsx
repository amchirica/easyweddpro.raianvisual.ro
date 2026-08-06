import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { AutomationForm } from "@/components/automations/automation-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import type { AutomationAction, AutomationCondition, AutomationTriggerKey } from "@/lib/automations/catalog";
import { getAutomationById, listAutomationRuns } from "@/lib/data/automations";
import { formatDateTime } from "@/lib/format";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Editează automatizare · EasyWedd Pro",
};

const RUN_STATUS_TONE = {
  success: "success",
  failed: "danger",
  skipped: "neutral",
  running: "accent",
  pending: "neutral",
} as const;

type AutomationDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AutomationDetailPage({ params }: AutomationDetailPageProps) {
  const { id } = await params;
  const ctx = await requireWorkspace();
  const permissions = permissionsForRole(ctx.role);

  if (!permissions.canManageAutomations) {
    return (
      <ModuleShell title="Automatizare" description="Editează o automatizare existentă.">
        <EmptyState
          icon={Lock}
          title="Nu ai permisiunea necesară"
          description="Contactează un administrator al workspace-ului pentru acces la automatizări."
        />
      </ModuleShell>
    );
  }

  const automation = await getAutomationById(ctx.supabase, ctx.activeWorkspace.id, id);
  if (!automation) notFound();

  const runs = await listAutomationRuns(ctx.supabase, ctx.activeWorkspace.id, automation.id, 20);

  return (
    <ModuleShell
      title={automation.name}
      description="Actualizează declanșatorul, condițiile și acțiunile acestei automatizări."
    >
      <div className="space-y-8">
        <AutomationForm
          mode="edit"
          initial={{
            id: automation.id,
            name: automation.name,
            description: automation.description ?? "",
            triggerKey: automation.trigger_key as AutomationTriggerKey,
            enabled: automation.enabled,
            channel: automation.channel === "email" ? "email" : "internal",
            conditions: Array.isArray(automation.conditions)
              ? (automation.conditions as unknown as AutomationCondition[])
              : [],
            actions: Array.isArray(automation.actions)
              ? (automation.actions as unknown as AutomationAction[])
              : [],
          }}
        />

        <div className="surface-card p-6">
          <p className="font-heading text-lg font-medium text-foreground">Istoric rulări</p>
          {runs.length === 0 ? (
            <p className="mt-3 text-sm text-muted-soft">Automatizarea nu a rulat încă.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[520px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-3 py-2 font-medium">Pornit la</th>
                    <th className="px-3 py-2 font-medium">Status</th>
                    <th className="px-3 py-2 font-medium">Eroare</th>
                  </tr>
                </thead>
                <tbody>
                  {runs.map((run) => (
                    <tr key={run.id} className="border-b border-border/60 last:border-0">
                      <td className="px-3 py-2.5 text-muted-foreground">{formatDateTime(run.started_at)}</td>
                      <td className="px-3 py-2.5">
                        <StatusBadge
                          label={run.status}
                          tone={RUN_STATUS_TONE[run.status as keyof typeof RUN_STATUS_TONE] ?? "neutral"}
                        />
                      </td>
                      <td className="px-3 py-2.5 text-xs text-muted-soft">{run.error ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </ModuleShell>
  );
}
