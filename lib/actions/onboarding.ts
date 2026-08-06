"use server";

import { redirect } from "next/navigation";

import { actionError, type ActionResult } from "@/lib/actions/types";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "@/lib/validations/crm";
import { setActiveWorkspaceId } from "@/lib/workspace/session";
import type { Json } from "@/types/database";

function userFacingOnboardingError(message?: string): string {
  const msg = (message ?? "").toLowerCase();
  if (msg.includes("not_authenticated")) {
    return "Sesiunea a expirat. Autentifică-te din nou.";
  }
  if (msg.includes("invalid_company_name")) {
    return "Numele companiei este invalid.";
  }
  return "Nu am putut finaliza onboarding-ul. Încearcă din nou.";
}

export async function completeOnboardingAction(
  input: unknown,
): Promise<ActionResult<{ workspaceId: string }>> {
  const parsed = onboardingSchema.safeParse(input);
  if (!parsed.success) {
    return actionError(parsed.error.issues[0]?.message ?? "Date invalide");
  }

  const supabase = await createClient();
  if (!supabase) {
    return actionError("Supabase nu este configurat.");
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return actionError(userFacingOnboardingError("not_authenticated"));
  }

  const { error: ensureError } = await supabase.rpc("ensure_own_profile");
  if (ensureError) {
    if (process.env.NODE_ENV === "development") {
      console.error("[onboarding.ensure_profile]", ensureError.message);
    }
    return actionError("Nu am putut inițializa profilul. Încearcă din nou.");
  }

  const data = parsed.data;
  const fiscalData =
    data.cui || data.fiscalAddress
      ? ({
          cui: data.cui || null,
          address: data.fiscalAddress || null,
        } as Json)
      : null;

  const settings = {
    importSkipped: data.importSkipped,
    firstPackage:
      data.packageName && data.packagePrice
        ? { name: data.packageName, price: data.packagePrice }
        : null,
    business_type: data.businessTypes,
    vendor_categories: data.vendorCategories,
    default_project_pipeline: data.defaultProjectPipeline || "generic",
    default_contract_template: data.defaultContractTemplate || "generic",
    default_proposal_template: "generic_service",
  } as Json;

  const { data: workspaceId, error: rpcError } = await supabase.rpc(
    "create_onboarding_workspace",
    {
      p_name: data.companyName,
      p_activity_type: data.activityType,
      p_city: data.city,
      p_country: data.country,
      p_services: data.services,
      p_events_per_year: data.eventsPerYear ?? null,
      p_team_size: data.teamSize || null,
      p_currency: data.currency,
      p_timezone: data.timezone,
      p_logo_url: data.logoUrl || null,
      p_brand_accent: data.brandAccent || null,
      p_fiscal_data: fiscalData,
      p_settings: settings,
    },
  );

  if (rpcError || !workspaceId) {
    if (process.env.NODE_ENV === "development") {
      console.error("[onboarding.rpc]", rpcError?.message);
    }
    return actionError(userFacingOnboardingError(rpcError?.message));
  }

  await setActiveWorkspaceId(workspaceId);

  redirect("/dashboard");
}
