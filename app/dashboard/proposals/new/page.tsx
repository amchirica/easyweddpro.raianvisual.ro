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

export const metadata: Metadata = {
  title: "Ofertă nouă · EasyWedd Pro",
};

type NewProposalPageProps = {
  searchParams: Promise<{ leadId?: string; clientId?: string }>;
};

export default async function NewProposalPage({ searchParams }: NewProposalPageProps) {
  const { leadId, clientId } = await searchParams;
  const ctx = await getWorkspaceOrDemo();

  const permissions = permissionsForRole(ctx.role);

  if (!permissions.canWriteProposals) {
    return (
      <ModuleShell
        title="Ofertă nouă"
        description="Creează o ofertă nouă pentru un client sau un lead."
      >
        <EmptyState
          icon={Lock}
          title="Nu ai permisiunea necesară"
          description="Contactează un administrator al workspace-ului pentru acces la crearea ofertelor."
          action={
            <Button type="button" variant="outline" render={<Link href="/dashboard/proposals" />} nativeButton={false}>
              Înapoi la oferte
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
    <ModuleShell title="Ofertă nouă" description="Creează o ofertă nouă pentru un client sau un lead.">
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
