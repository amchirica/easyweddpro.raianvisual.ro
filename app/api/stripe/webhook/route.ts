import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";

import { getStripe, getStripeWebhookSecret, isStripeConfigured, mapPriceIdToPlan } from "@/lib/billing/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

export const runtime = "nodejs";

type AdminClient = ReturnType<typeof createAdminClient>;
type SubscriptionUpdate = Database["public"]["Tables"]["subscriptions"]["Update"];

function toIso(unixSeconds: number | null | undefined): string | null {
  if (!unixSeconds) return null;
  return new Date(unixSeconds * 1000).toISOString();
}

function resolveCustomerId(customer: string | Stripe.Customer | Stripe.DeletedCustomer | null): string | null {
  if (!customer) return null;
  return typeof customer === "string" ? customer : customer.id;
}

/**
 * Persists the Stripe subscription as the source of truth for a workspace's plan/status.
 * Resolves the target workspace via subscription metadata first, falling back to the
 * existing stripe_customer_id link (metadata may be absent for subscriptions created
 * outside our checkout flow, e.g. directly in the Stripe dashboard).
 */
async function syncSubscriptionFromStripe(
  admin: AdminClient,
  subscription: Stripe.Subscription,
  fallbackWorkspaceId?: string | null,
): Promise<void> {
  const customerId = resolveCustomerId(subscription.customer);
  const workspaceId = subscription.metadata?.workspace_id || fallbackWorkspaceId || null;

  const item = subscription.items.data[0];
  const priceId = item?.price?.id ?? null;
  const mapped = mapPriceIdToPlan(priceId);

  const update: SubscriptionUpdate = {
    status: subscription.status,
    stripe_subscription_id: subscription.id,
    stripe_price_id: priceId,
    billing_interval: mapped?.interval ?? item?.price?.recurring?.interval ?? null,
    current_period_start: toIso(item?.current_period_start),
    current_period_end: toIso(item?.current_period_end),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_end: toIso(subscription.trial_end),
    updated_at: new Date().toISOString(),
  };

  if (mapped?.planId) {
    update.plan = mapped.planId;
  }
  if (customerId) {
    update.stripe_customer_id = customerId;
  }

  if (workspaceId) {
    const { error } = await admin.from("subscriptions").update(update).eq("workspace_id", workspaceId);
    if (error && process.env.NODE_ENV === "development") {
      console.error("[stripe.webhook.sync.byWorkspace]", error.message);
    }
    return;
  }

  if (customerId) {
    const { error } = await admin.from("subscriptions").update(update).eq("stripe_customer_id", customerId);
    if (error && process.env.NODE_ENV === "development") {
      console.error("[stripe.webhook.sync.byCustomer]", error.message);
    }
  }
}

async function handleCheckoutSessionCompleted(
  admin: AdminClient,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<void> {
  if (session.mode !== "subscription") return;

  const subscriptionRef = session.subscription;
  const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
  if (!subscriptionId) return;

  const workspaceId = session.client_reference_id || session.metadata?.workspace_id || null;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscriptionFromStripe(admin, subscription, workspaceId);
}

async function handleInvoiceEvent(admin: AdminClient, stripe: Stripe, invoice: Stripe.Invoice): Promise<void> {
  const subscriptionDetails =
    invoice.parent?.type === "subscription_details" ? invoice.parent.subscription_details : null;
  const subscriptionRef = subscriptionDetails?.subscription;
  const subscriptionId = typeof subscriptionRef === "string" ? subscriptionRef : subscriptionRef?.id;
  if (!subscriptionId) return;

  const workspaceId = (subscriptionDetails?.metadata?.workspace_id as string | undefined) || null;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscriptionFromStripe(admin, subscription, workspaceId);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Stripe nu este configurat." }, { status: 500 });
  }

  const webhookSecret = getStripeWebhookSecret();
  if (!webhookSecret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET nu este configurat." }, { status: 500 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Semnătură lipsă." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Semnătură invalidă." }, { status: 400 });
  }

  const admin = createAdminClient();

  // Idempotency: the event id is the primary key, so a duplicate delivery fails the insert
  // and we can acknowledge without reprocessing side effects.
  const { error: insertError } = await admin.from("stripe_webhook_events").insert({
    id: event.id,
    type: event.type,
    payload_summary: { livemode: event.livemode, created: event.created } as Database["public"]["Tables"]["stripe_webhook_events"]["Insert"]["payload_summary"],
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({ received: true, duplicate: true });
    }
    if (process.env.NODE_ENV === "development") {
      console.error("[stripe.webhook.idempotency]", insertError.message);
    }
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(admin, stripe, event.data.object);
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscriptionFromStripe(admin, event.data.object);
        break;
      }
      case "invoice.paid":
      case "invoice.payment_failed": {
        await handleInvoiceEvent(admin, stripe, event.data.object);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error(`[stripe.webhook.${event.type}]`, error);
    }
    return NextResponse.json({ error: "Eroare la procesarea evenimentului." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
