"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { activateWorkspaceAction, changePlanAction, suspendWorkspaceAction } from "@/lib/actions/admin";
import type { PlanId } from "@/lib/billing/plan-catalog";

const PLAN_OPTIONS: Array<{ id: PlanId; label: string }> = [
  { id: "free", label: "Free" },
  { id: "solo", label: "Solo" },
  { id: "studio", label: "Studio" },
  { id: "agency", label: "Agency" },
];

export function WorkspaceActions({
  workspaceId,
  plan,
  isSuspended,
}: {
  workspaceId: string;
  plan: string;
  isSuspended: boolean;
}) {
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  async function handleToggleSuspend() {
    setPending(true);
    const result = isSuspended
      ? await activateWorkspaceAction({ workspaceId })
      : await suspendWorkspaceAction({ workspaceId });
    setPending(false);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Actualizat.", "success");
    router.refresh();
  }

  async function handlePlanChange(planId: string) {
    if (planId === plan) return;
    setPending(true);
    const result = await changePlanAction({ workspaceId, planId });
    setPending(false);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Plan actualizat.", "success");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        value={plan}
        disabled={pending}
        onChange={(event) => handlePlanChange(event.target.value)}
        className="h-7 rounded-md border border-border bg-background px-2 text-xs text-foreground disabled:opacity-50"
        aria-label="Schimbă planul"
      >
        {PLAN_OPTIONS.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
      <Button
        type="button"
        variant={isSuspended ? "outline" : "destructive"}
        size="xs"
        disabled={pending}
        onClick={handleToggleSuspend}
      >
        {isSuspended ? "Reactivează" : "Suspendă"}
      </Button>
    </div>
  );
}
