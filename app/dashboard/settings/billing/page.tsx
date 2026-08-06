import type { Metadata } from "next";

import { BillingPageClient } from "@/components/billing/billing-page-client";
import { getPlanLimits, getUsageForWorkspace, PLAN_CATALOG } from "@/lib/billing/plans";
import { isStripeConfigured } from "@/lib/billing/stripe";
import { permissionsForRole } from "@/lib/workspace/permissions";
import { requireWorkspace } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Facturare · EasyWedd Pro",
};

export default async function BillingPage() {
  const ctx = await requireWorkspace();
  const permissions = permissionsForRole(ctx.role);

  const [usage, { data: subscription }] = await Promise.all([
    getUsageForWorkspace(ctx.supabase, ctx.activeWorkspace.id),
    ctx.supabase
      .from("subscriptions")
      .select(
        "plan, status, current_period_end, current_period_start, cancel_at_period_end, trial_end, trial_ends_at, billing_interval, stripe_customer_id",
      )
      .eq("workspace_id", ctx.activeWorkspace.id)
      .maybeSingle(),
  ]);

  const limits = getPlanLimits(usage.plan);

  return (
    <BillingPageClient
      canManageBilling={permissions.canManageWorkspace}
      isStripeConfigured={isStripeConfigured()}
      plans={PLAN_CATALOG}
      usage={usage}
      limits={limits}
      subscription={{
        status: subscription?.status ?? usage.status,
        currentPeriodEnd: subscription?.current_period_end ?? null,
        currentPeriodStart: subscription?.current_period_start ?? null,
        cancelAtPeriodEnd: subscription?.cancel_at_period_end ?? false,
        trialEnd: subscription?.trial_end ?? subscription?.trial_ends_at ?? null,
        billingInterval: (subscription?.billing_interval as "month" | "year" | null) ?? null,
        hasStripeCustomer: Boolean(subscription?.stripe_customer_id),
      }}
    />
  );
}
