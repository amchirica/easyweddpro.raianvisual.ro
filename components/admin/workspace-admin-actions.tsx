"use client";

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
              Schimbă planul
            </Button>
          }
          title="Schimbă planul workspace-ului"
          description="Planul va fi actualizat imediat pentru workspace și abonament."
          confirmLabel="Salvează planul"
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
          description="Setează o nouă dată de expirare a trial-ului relativ la acum."
          confirmLabel="Extinde"
          onConfirm={async (reason) => {
            const days = Number.parseInt(trialDays, 10);
            if (!Number.isFinite(days) || days < 1) {
              throw new Error("Numărul de zile este invalid.");
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
              {isSuspended ? "Reactivează" : "Suspendă"}
            </Button>
          }
          title={isSuspended ? "Reactivează workspace-ul" : "Suspendă workspace-ul"}
          description={
            isSuspended
              ? "Abonamentul va trece în status activ."
              : "Abonamentul va trece în status suspendat."
          }
          confirmLabel={isSuspended ? "Reactivează" : "Suspendă"}
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
          Inspectează
        </Button>
      </AdminActionMenu>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="admin-plan">Plan țintă</Label>
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
