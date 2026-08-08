import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

import { ProposalForm } from "@/components/proposals/proposal-form";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { Button } from "@/components/ui/button";
import { listClients } from "@/lib/data/clients";
import { listLeads } from "@/lib/data/leads";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";
import { getTranslator } from "@/lib/i18n/t";

export async function generateMetadata() {
  const { t } = await getTranslator();
  return { title: `${t("modules.proposals.new")} · EasyWedd Pro` };
}

type NewProposalPageProps = {
  searchParams: Promise<{ leadId?: string; clientId?: string }>;
};

export default async function NewProposalPage({ searchParams }: NewProposalPageProps) {
  const { t } = await getTranslator();
  const { leadId, clientId } = await searchParams;
  const ctx = await getWorkspaceOrDemo();

  const permissions = permissionsForRole(ctx.role);

  if (!permissions.canWriteProposals) {
    return (
      <ModuleShell
        title={t("modules.proposals.new")}
        description={t("modules.proposals.description")}
      >
        <EmptyState
          icon={Lock}
          title={t("modules.permissionDenied")}
          description={t("modules.permissionDeniedHint")}
          action={
            <Button type="button" variant="outline" render={<Link href="/dashboard/proposals" />} nativeButton={false}>
              {t("modules.backToList")}
            </Button>
          }
        />
      </ModuleShell>
    );
  }

  const [clientRows, leadsResult] = await Promise.all([
    listClients(ctx.supabase, ctx.workspace.id, { limit: 200 }),
    listLeads(ctx.supabase, { workspaceId: ctx.workspace.id, limit: 200 }),
  ]);

  const clients = clientRows.map((client) => ({ id: client.id, name: client.name }));
  const leads = leadsResult.leads.map((lead) => ({ id: lead.id, name: lead.name }));

  return (
    <ModuleShell title={t("modules.proposals.new")} description={t("modules.proposals.description")}>
      <ProposalForm
        mode="create"
        clients={clients}
        leads={leads}
        defaultClientId={clientId ?? null}
        defaultLeadId={leadId ?? null}
        currency={ctx.workspace.currency}
        canWrite={permissions.canWriteProposals}
      />
    </ModuleShell>
  );
}
