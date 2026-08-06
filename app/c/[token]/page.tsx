import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  PublicContractView,
  type PublicContractViewData,
} from "@/components/contracts/public-contract-view";
import {
  fetchPublicContract,
  markPublicContractViewed,
  type PublicContractPayload,
} from "@/lib/data/contracts";
import { DEFAULT_CONTRACT_SECTIONS, parseContractContent } from "@/lib/contracts/content";
import { getEffectiveContractStatus } from "@/lib/contracts/status";
import { createClient } from "@/lib/supabase/server";

type PublicContractPageProps = {
  params: Promise<{ token: string }>;
};

export const metadata: Metadata = {
  title: "Contract",
  robots: { index: false, follow: false },
};

function mapLivePayload(payload: PublicContractPayload): PublicContractViewData {
  const fromContent = parseContractContent(payload.content);
  const snap = payload.snapshot;
  const services =
    (snap?.items?.length ? snap.items : null) ??
    fromContent?.services ??
    [];
  const sections = {
    ...DEFAULT_CONTRACT_SECTIONS,
    ...(snap?.sections ?? fromContent?.sections ?? {}),
  };

  const effectiveStatus = getEffectiveContractStatus({
    status: payload.status,
    validUntil: payload.valid_until,
    acceptedAt: payload.accepted_at,
  });

  return {
    contractNumber: payload.contract_number,
    title: payload.title,
    status: effectiveStatus,
    currency: payload.currency,
    subtotal: Number(payload.subtotal),
    discountAmount: Number(payload.discount_amount),
    taxAmount: Number(payload.tax_amount),
    total: Number(payload.total),
    depositAmount: Number(payload.deposit_amount),
    remainingAmount: Number(payload.remaining_amount),
    eventDate: payload.event_date,
    eventLocation: payload.event_location ?? snap?.event_location ?? null,
    validUntil: payload.valid_until,
    publishedAt: payload.published_at,
    acceptedAt: payload.accepted_at,
    terms: payload.terms ?? snap?.terms ?? null,
    providerName: payload.provider_name ?? snap?.provider?.name ?? null,
    clientName: payload.client_name ?? snap?.client?.name ?? null,
    services,
    sections,
    documentHash: payload.contract_content_hash ?? snap?.contract_content_hash ?? null,
    version: payload.version ?? 1,
  };
}

export default async function PublicContractPage({ params }: PublicContractPageProps) {
  const { token } = await params;

  const supabase = await createClient();
  if (supabase) {
    let payload: PublicContractPayload | null = null;
    let rpcError: string | null = null;
    try {
      payload = await markPublicContractViewed(supabase, token);
      if (!payload) {
        payload = await fetchPublicContract(supabase, token);
      }
    } catch (error) {
      rpcError = error instanceof Error ? error.message : "Eroare la încărcarea contractului.";
      if (process.env.NODE_ENV === "development") {
        console.error("Request failed", {
          operation: "public_contract_page",
          url: "/c/[token]",
          message: rpcError,
        });
      }
    }
    if (payload) {
      return (
        <PublicContractView token={token} data={mapLivePayload(payload)} demo={false} />
      );
    }
    if (rpcError) {
      return (
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
          <h1 className="font-heading text-2xl font-medium text-foreground">
            Contract indisponibil
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Conexiunea cu serverul nu a putut fi realizată. Verifică configurația și încearcă din
            nou.
          </p>
          {process.env.NODE_ENV === "development" ? (
            <p className="mt-4 rounded-md border border-border bg-surface-elevated/60 px-3 py-2 text-left text-xs text-muted-soft">
              {rpcError}
            </p>
          ) : null}
        </div>
      );
    }
  }

  notFound();
}
