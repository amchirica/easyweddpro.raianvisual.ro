"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { AdminActionMenu } from "@/components/admin/admin-action-menu";
import { AdminConfirmDialog } from "@/components/admin/admin-confirm-dialog";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { activateWorkspaceAction, suspendWorkspaceAction } from "@/lib/actions/admin";
import { changeWorkspacePlanAction, extendTrialAction } from "@/lib/actions/platform-admin";
import type { PlanId } from "@/lib/billing/plan-catalog";

const PLAN_OPTIONS: Array<{ id: PlanId; label: string }> = [
  { id: "free", label: "Free" },
  { id: "solo", label: "Solo" },
  { id: "studio", label: "Studio" },
  { id: "agency", label: "Agency" },
];

export function WorkspaceAdminActions({
  workspaceId,
  plan,
  isSuspended,
}: {
  workspaceId: string;
  plan: string;
  isSuspended: boolean;
}) {
  const { t } = useI18n();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState(plan);
  const [trialDays, setTrialDays] = useState("14");

  async function run(action: () => Promise<{ error?: string; success?: string }>) {
    const result = await action();
    if (result?.error) throw new Error(result.error);
    toast(result?.success ?? "Actualizat.", "success");
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <AdminActionMenu>
        <AdminConfirmDialog
          trigger={
            <Button type="button" size="sm" variant="outline">
              {t("admin.changePlan")}
            </Button>
          }
          title={t("admin.changePlanTitle")}
          description={t("admin.changePlanDesc")}
          confirmLabel={t("admin.savePlan")}
          onConfirm={async (reason) => {
            await run(() =>
              changeWorkspacePlanAction({
                workspaceId,
                planId: selectedPlan,
                reason,
              }),
            );
          }}
        />
        <AdminConfirmDialog
          trigger={
            <Button type="button" size="sm" variant="outline">
              Extinde trial
            </Button>
          }
          title="Extinde perioada de trial"
          description={t("admin.extendTrialDesc")}
          confirmLabel="Extinde"
          onConfirm={async (reason) => {
            const days = Number.parseInt(trialDays, 10);
            if (!Number.isFinite(days) || days < 1) {
              throw new Error(t("admin.invalidDays"));
            }
            await run(() => extendTrialAction({ workspaceId, days, reason }));
          }}
        />
        <AdminConfirmDialog
          trigger={
            <Button
              type="button"
              size="sm"
              variant={isSuspended ? "outline" : "destructive"}
            >
              {isSuspended ? t("admin.reactivate") : t("admin.suspend")}
            </Button>
          }
          title={isSuspended ? t("admin.reactivateWorkspace") : t("admin.suspendWorkspace")}
          description={
            isSuspended
              ? t("admin.subToActive")
              : t("admin.subToSuspended")
          }
          confirmLabel={isSuspended ? t("admin.reactivate") : t("admin.suspend")}
          destructive={!isSuspended}
          onConfirm={async () => {
            const result = isSuspended
              ? await activateWorkspaceAction({ workspaceId })
              : await suspendWorkspaceAction({ workspaceId });
            if (result?.error) throw new Error(result.error);
            toast(result?.success ?? "Actualizat.", "success");
            router.refresh();
          }}
        />
        <Button
          type="button"
          size="sm"
          nativeButton={false}
          render={<Link href={`/admin/workspaces/${workspaceId}/inspect`} />}
        >
          {t("admin.inspect")}
        </Button>
      </AdminActionMenu>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="admin-plan">{t("admin.targetPlan")}</Label>
          <select
            id="admin-plan"
            value={selectedPlan}
            onChange={(e) => setSelectedPlan(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-border bg-background px-3 text-sm"
          >
            {PLAN_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="admin-trial-days">Zile trial</Label>
          <Input
            id="admin-trial-days"
            type="number"
            min={1}
            max={90}
            value={trialDays}
            onChange={(e) => setTrialDays(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
