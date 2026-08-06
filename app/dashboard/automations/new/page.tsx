import type { Metadata } from "next";
import { Lock } from "lucide-react";

import { AutomationForm } from "@/components/automations/automation-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Automatizare nouă · EasyWedd Pro",
};

export default async function NewAutomationPage() {
  const ctx = await requireWorkspace();
  const permissions = permissionsForRole(ctx.role);

  if (!permissions.canManageAutomations) {
    return (
      <ModuleShell title="Automatizare nouă" description="Creează o automatizare nouă.">
        <EmptyState
          icon={Lock}
          title="Nu ai permisiunea necesară"
          description="Contactează un administrator al workspace-ului pentru acces la automatizări."
        />
      </ModuleShell>
    );
  }

  return (
    <ModuleShell
      title="Automatizare nouă"
      description="Alege un declanșator, condiții opționale și acțiunile care se execută automat."
    >
      <AutomationForm mode="create" />
    </ModuleShell>
  );
}
