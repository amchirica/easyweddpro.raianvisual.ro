import type { Metadata } from "next";
import { getTranslator } from "@/lib/i18n/t";
import { notFound } from "next/navigation";

import {
  PublicProposalView,
  type PublicProposalItem,
  type PublicProposalStatus,
  type PublicProposalViewData,
} from "@/components/proposals/public-proposal-view";
import { fetchPublicProposal, type PublicProposalPayload } from "@/lib/data/proposals";
import { createClient } from "@/lib/supabase/server";

type ProposalPageProps = {
  params: Promise<{ token: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getTranslator();
  return {
    title: t("portal.proposal"),
    robots: { index: false, follow: false },
  };
}

function mapLivePayload(payload: PublicProposalPayload): PublicProposalViewData {
  return {
    proposalNumber: payload.proposal_number,
    title: payload.title,
    status: payload.status as PublicProposalStatus,
    currency: payload.currency,
    subtotal: Number(payload.subtotal),
    discountAmount: Number(payload.discount_amount),
    taxAmount: Number(payload.tax_amount),
    total: Number(payload.total),
    validUntil: payload.valid_until,
    createdAt: payload.created_at,
    terms: payload.terms,
    notes: payload.notes,
    clientName: payload.client_name,
    providerName: payload.provider_name,
    items: (payload.items ?? []).map(
      (item): PublicProposalItem => ({
        name: item.name,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unit_price),
        discount: Number(item.discount),
        lineTotal: Number(item.line_total),
      }),
    ),
  };
}

export default async function PublicProposalPage({ params }: ProposalPageProps) {
  const { token } = await params;

  const supabase = await createClient();
  if (supabase) {
    let payload: PublicProposalPayload | null = null;
    try {
      payload = await fetchPublicProposal(supabase, token, true);
    } catch {
      payload = null;
    }
    if (payload) {
      return <PublicProposalView token={token} data={mapLivePayload(payload)} demo={false} />;
    }
  }

  notFound();
}
