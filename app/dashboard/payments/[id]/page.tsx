import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PaymentDetail, type PaymentDetailData } from "@/components/payments/payment-detail";
import { ModuleShell } from "@/components/shared/module-shell";
import { listClients } from "@/lib/data/clients";
import { getPaymentById } from "@/lib/data/payments";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";

type PaymentPageParams = { id: string };

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Plată · EasyWedd Pro",
  };
}

export default async function PaymentDetailPage({
  params,
}: {
  params: Promise<PaymentPageParams>;
}) {
  const { id } = await params;
  const ctx = await requireWorkspace();

  let row;
  try {
    row = await getPaymentById(ctx.supabase, ctx.activeWorkspace.id, id);
  } catch {
    notFound();
  }

  if (!row) notFound();

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

  const permissions = permissionsForRole(ctx.role);

  const payment: PaymentDetailData = {
    id: row.id,
    label: row.label,
    amount: Number(row.amount),
    paidAmount: Number(row.paid_amount),
    currency: row.currency,
    dueDate: row.due_date,
    method: row.method as PaymentDetailData["method"],
    status: row.effectiveStatus as PaymentDetailData["status"],
    clientId: row.client_id,
    clientName: row.clientName,
    contractId: row.contract_id,
    contractTitle: row.contractTitle,
    contractStatus: row.contractStatus,
    projectId: row.project_id,
    projectName: row.projectName,
    reference: row.reference ?? "",
    notes: row.notes ?? "",
    proofUrl: row.proof_url ?? "",
    paidAt: row.paid_at,
    cancelledAt: row.cancelled_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };

  return (
    <ModuleShell title={payment.label} description="Detalii plată">
      <PaymentDetail
        payment={payment}
        clients={clientRows.map((client) => ({ id: client.id, name: client.name }))}
        contracts={(contractRows.data ?? []).map((contract) => ({ id: contract.id, name: contract.title }))}
        projects={(projectRows.data ?? []).map((project) => ({ id: project.id, name: project.name }))}
        defaultCurrency={ctx.activeWorkspace.currency}
        canWrite={permissions.canWritePayments}
        canDelete={permissions.canDeletePayments}
      />
    </ModuleShell>
  );
}
