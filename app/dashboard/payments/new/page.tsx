import type { Metadata } from "next";
import Link from "next/link";
import { Lock } from "lucide-react";

import { NewPaymentDialogPage } from "@/components/payments/new-payment-dialog-page";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { Button } from "@/components/ui/button";
import { listClients } from "@/lib/data/clients";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";
import { getTranslator } from "@/lib/i18n/t";

export const metadata: Metadata = {
  title: "Plată nouă · EasyWedd Pro",
};

export default async function NewPaymentPage() {
  const { t } = await getTranslator();
  const ctx = await requireWorkspace();
  const permissions = permissionsForRole(ctx.role);

  if (!permissions.canWritePayments) {
    return (
      <ModuleShell title={t("modules.payments.new")} description={t("modules.payments.description")}>
        <EmptyState
          icon={Lock}
          title={t("modules.permissionDenied")}
          description={t("modules.permissionDeniedHint")}
          action={
            <Button
              type="button"
              variant="outline"
              render={<Link href="/dashboard/payments" />}
              nativeButton={false}
            >
              {t("modules.backToList")}
            </Button>
          }
        />
      </ModuleShell>
    );
  }

  const [clientRows, contractRows, projectRows] = await Promise.all([
    listClients(ctx.supabase, ctx.activeWorkspace.id, { limit: 200 }),
    ctx.supabase
      .from("contracts")
      .select("id, title")
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
    ctx.supabase
      .from("projects")
      .select("id, name")
      .eq("workspace_id", ctx.activeWorkspace.id)
      .is("deleted_at", null)
      .order("name", { ascending: true })
      .limit(200),
  ]);

  return (
    <ModuleShell title={t("modules.payments.new")} description={t("modules.payments.description")}>
      <NewPaymentDialogPage
        clients={clientRows.map((client) => ({ id: client.id, name: client.name }))}
        contracts={(contractRows.data ?? []).map((contract) => ({ id: contract.id, name: contract.title }))}
        projects={(projectRows.data ?? []).map((project) => ({ id: project.id, name: project.name }))}
        defaultCurrency={ctx.activeWorkspace.currency}
      />
    </ModuleShell>
  );
}
