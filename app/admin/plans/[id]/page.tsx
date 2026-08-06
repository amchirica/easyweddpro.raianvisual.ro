import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminDetailPanel } from "@/components/admin/admin-detail-panel";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { PlanEditForm } from "@/components/admin/plan-edit-form";
import { canPerformPlatformAction } from "@/lib/platform/permissions";
import { listAdminPlans } from "@/lib/platform/plans";
import { requirePlatformPermission } from "@/lib/platform/session";

export default async function AdminPlanEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const admin = await requirePlatformPermission("plans.read");
  const canWrite = canPerformPlatformAction(admin.platformRole, "plans.write");

  let loadError: string | null = null;
  let plan: Awaited<ReturnType<typeof listAdminPlans>>[number] | undefined;
  try {
    const plans = await listAdminPlans(admin.supabase);
    plan = plans.find((p) => p.id === id);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Nu am putut încărca planul.";
  }

  if (loadError) {
    return (
      <div className="space-y-4">
        <h1 className="font-heading text-3xl font-medium text-foreground">Plan</h1>
        <AdminErrorState message={loadError} />
      </div>
    );
  }
  if (!plan) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/plans" className="text-xs text-muted-soft hover:text-foreground">
          ← Înapoi la planuri
        </Link>
        <h1 className="mt-2 font-heading text-3xl font-medium text-foreground">
          {canWrite ? "Editează" : "Plan"} {plan.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          ID: {plan.id} · versiune curentă {plan.version}
        </p>
      </div>

      <AdminDetailPanel
        title="Setări plan"
        description="Modificările de preț creează o versiune nouă în plan_versions."
      >
        {canWrite ? (
          <PlanEditForm
            planId={plan.id}
            initial={{
              name: plan.name,
              description: plan.description,
              priceMonthly: plan.priceMonthlyRon,
              visible: plan.visible,
              active: plan.active,
              highlighted: Boolean(plan.highlighted),
            }}
          />
        ) : (
          <p className="text-sm text-muted-soft">
            Rolul tău permite doar citirea planului. Nume: {plan.name} ·{" "}
            {plan.priceMonthlyRon} RON / lună.
          </p>
        )}
      </AdminDetailPanel>
    </div>
  );
}
