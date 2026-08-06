"use server";

import { logActivity } from "@/lib/activity/log";
import { actionError, actionSuccess, type ActionResult } from "@/lib/actions/types";
import { getPriceId, getStripe, isStripeConfigured } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSiteUrl } from "@/lib/url";
import { createCheckoutSessionSchema } from "@/lib/validations/billing";
import { requireWorkspaceAction } from "@/lib/workspace/permissions";

const INTERVAL_LABEL: Record<"month" | "year", string> = {
  month: "lunar",
  year: "anual",
};

export async function createCheckoutSessionAction(
  input: unknown,
): Promise<ActionResult<{ url: string }>> {
  const parsed = createCheckoutSessionSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide.");
  }

  let ctx;
  try {
    ctx = await requireWorkspaceAction("workspace.manage");
  } catch {
    return actionError("Doar proprietarul sau administratorul poate schimba planul de facturare.");
  }

  if (!isStripeConfigured()) {
    return actionError("Facturarea prin Stripe nu este configurată încă. Contactează suportul.");
  }

  const { planId, interval } = parsed.data;
  const priceId = getPriceId(planId, interval);
  if (!priceId) {
    return actionError(
      `Planul nu are un preț ${INTERVAL_LABEL[interval]} configurat momentan. Contactează suportul.`,
    );
  }

  const workspace = ctx.activeWorkspace;

  const { data: existingSubscription } = await ctx.supabase
    .from("subscriptions")
    .select("stripe_customer_id, plan, status")
    .eq("workspace_id", workspace.id)
    .maybeSingle();

  const stripe = getStripe();
  let customerId = existingSubscription?.stripe_customer_id ?? null;

  if (!customerId) {
    let customer;
    try {
      customer = await stripe.customers.create({
        email: ctx.user.email ?? undefined,
        name: workspace.name,
        metadata: { workspace_id: workspace.id },
      });
    } catch {
      return actionError("Nu am putut iniția plata. Încearcă din nou.");
    }
    customerId = customer.id;

    // Subscriptions RLS restricts direct writes to platform admins — persist via the service-role client.
    const admin = createAdminClient();
    const { error: upsertError } = await admin.from("subscriptions").upsert(
      {
        workspace_id: workspace.id,
        stripe_customer_id: customerId,
        plan: existingSubscription?.plan ?? "free",
        status: existingSubscription?.status ?? "inactive",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "workspace_id" },
    );
    if (upsertError && process.env.NODE_ENV === "development") {
      console.error("[billing.checkout.saveCustomer]", upsertError.message);
    }
  }

  let session;
  try {
    session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      client_reference_id: workspace.id,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { workspace_id: workspace.id },
      },
      allow_promotion_codes: true,
      success_url: `${getSiteUrl()}/dashboard/settings/billing?checkout=success`,
      cancel_url: `${getSiteUrl()}/dashboard/settings/billing?checkout=cancelled`,
    });
  } catch {
    return actionError("Nu am putut crea sesiunea de plată. Încearcă din nou.");
  }

  if (!session.url) {
    return actionError("Sesiunea de plată nu a putut fi generată.");
  }

  await logActivity(ctx.supabase, {
    workspaceId: workspace.id,
    actorId: ctx.user.id,
    entityType: "subscription",
    action: "billing.checkout_started",
    title: "Sesiune de plată inițiată",
    description: `Plan ${planId} (${INTERVAL_LABEL[interval]})`,
  });

  return actionSuccess("Sesiune de plată creată.", { url: session.url });
}

export async function createBillingPortalSessionAction(): Promise<ActionResult<{ url: string }>> {
  let ctx;
  try {
    ctx = await requireWorkspaceAction("workspace.manage");
  } catch {
    return actionError("Doar proprietarul sau administratorul poate gestiona facturarea.");
  }

  if (!isStripeConfigured()) {
    return actionError("Facturarea prin Stripe nu este configurată încă. Contactează suportul.");
  }

  const { data: subscription } = await ctx.supabase
    .from("subscriptions")
    .select("stripe_customer_id")
    .eq("workspace_id", ctx.activeWorkspace.id)
    .maybeSingle();

  if (!subscription?.stripe_customer_id) {
    return actionError("Nu există încă un client de facturare pentru acest workspace. Alege mai întâi un plan plătit.");
  }

  const stripe = getStripe();

  let portalSession;
  try {
    portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.stripe_customer_id,
      return_url: `${getSiteUrl()}/dashboard/settings/billing`,
    });
  } catch {
    return actionError("Nu am putut deschide portalul de facturare. Încearcă din nou.");
  }

  return actionSuccess("Portal de facturare deschis.", { url: portalSession.url });
}
