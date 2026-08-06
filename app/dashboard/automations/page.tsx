import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { AutomationsListClient, type AutomationListItem } from "@/components/automations/automations-list-client";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { countAutomationRunOutcomes, listAutomations } from "@/lib/data/automations";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Automatizări · EasyWedd Pro",
};

export default async function AutomationsPage() {
  const ctx = await requireWorkspace();
  const permissions = permissionsForRole(ctx.role);

  if (!permissions.canManageAutomations) {
    return (
      <ModuleShell
        title="Automatizări"
        description="Reguli automate care trimit mesaje și reminder-e fără intervenție manuală."
      >
        <EmptyState
          icon={Lock}
          title="Nu ai permisiunea necesară"
          description="Contactează un administrator al workspace-ului pentru acces la automatizări."
        />
      </ModuleShell>
    );
  }

  let automations: AutomationListItem[] = [];
  let loadError: string | null = null;
  try {
    const [rows, counts] = await Promise.all([
      listAutomations(ctx.supabase, ctx.activeWorkspace.id),
      countAutomationRunOutcomes(ctx.supabase, ctx.activeWorkspace.id),
    ]);
    automations = rows.map((row) => {
      const runCounts = counts.get(row.id);
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        triggerKey: row.trigger_key,
        channel: row.channel,
        enabled: row.enabled,
        lastRunAt: row.last_run_at,
        successCount: runCounts?.success ?? 0,
        failedCount: runCounts?.failed ?? 0,
      };
    });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Nu am putut încărca automatizările.";
  }

  if (loadError) {
    return (
      <ModuleShell title="Automatizări" description="Reguli automate pentru workspace-ul tău.">
        <EmptyState title="Eroare la încărcare" description={loadError} />
      </ModuleShell>
    );
  }

  return <AutomationsListClient initialAutomations={automations} />;
}
