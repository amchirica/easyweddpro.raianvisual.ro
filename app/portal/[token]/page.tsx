import { notFound } from "next/navigation";
import {
  CalendarDays,
  CircleDollarSign,
  Download,
  FileText,
  Mail,
  MapPin,
  Phone,
  ScrollText,
} from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  CONTRACT_STATUS_LABELS,
  PAYMENT_STATUS_LABELS,
  PROJECT_STATUS_LABELS,
  PROPOSAL_STATUS_LABELS,
  type ContractStatus,
  type PaymentStatus,
  type ProjectStatus,
  type ProposalStatus,
} from "@/lib/constants";
import { fetchClientPortal } from "@/lib/data/contracts";
import { formatCurrency, formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

type PortalPageProps = {
  params: Promise<{ token: string }>;
};

const SECTIONS = [
  { id: "overview", label: "Prezentare", icon: FileText },
  { id: "offer", label: "Ofertă", icon: FileText },
  { id: "contract", label: "Contract", icon: ScrollText },
  { id: "payments", label: "Plăți", icon: CircleDollarSign },
  { id: "event", label: "Eveniment", icon: CalendarDays },
  { id: "contact", label: "Contact", icon: Mail },
];

const PROPOSAL_STATUS_TONE: Record<
  ProposalStatus,
  "neutral" | "accent" | "warning" | "success" | "danger"
> = {
  draft: "neutral",
  sent: "accent",
  viewed: "warning",
  accepted: "success",
  rejected: "danger",
  expired: "neutral",
  cancelled: "danger",
};

const CONTRACT_STATUS_TONE: Record<
  ContractStatus,
  "neutral" | "accent" | "warning" | "success" | "danger"
> = {
  draft: "neutral",
  published: "accent",
  viewed: "warning",
  accepted: "success",
  expired: "neutral",
  cancelled: "danger",
  superseded: "neutral",
};

const PAYMENT_STATUS_TONE: Record<
  PaymentStatus,
  "neutral" | "accent" | "warning" | "success" | "danger"
> = {
  pending: "accent",
  partial: "warning",
  paid: "success",
  overdue: "danger",
  cancelled: "neutral",
  refunded: "neutral",
};

function paymentStatusLabel(status: string): string {
  if (status in PAYMENT_STATUS_LABELS) {
    return PAYMENT_STATUS_LABELS[status as PaymentStatus];
  }
  return status;
}

function projectStatusLabel(status: string): string {
  if (status in PROJECT_STATUS_LABELS) {
    return PROJECT_STATUS_LABELS[status as ProjectStatus];
  }
  return status;
}

function proposalStatusLabel(status: string): string {
  if (status in PROPOSAL_STATUS_LABELS) {
    return PROPOSAL_STATUS_LABELS[status as ProposalStatus];
  }
  return status;
}

function contractStatusLabel(status: string): string {
  if (status in CONTRACT_STATUS_LABELS) {
    return CONTRACT_STATUS_LABELS[status as ContractStatus];
  }
  return status;
}

type PortalLayoutProps = {
  clientName: string;
  overview: {
    eventType: string | null;
    eventDate: string | null;
    totalLabel: string;
    subtitle: string | null;
  };
  offer: {
    title: string;
    validUntil: string | null;
    status: string;
    statusLabel: string;
    statusTone: "neutral" | "accent" | "warning" | "success" | "danger";
    total: number;
    currency: string;
    proposalNumber?: string | null;
  } | null;
  contract: {
    title: string;
    status: string;
    statusLabel: string;
    statusTone: "neutral" | "accent" | "warning" | "success" | "danger";
    total: number;
    deposit: number;
    remaining: number;
    currency: string;
    eventDate: string | null;
    acceptedAt: string | null;
    hasPublicLink: boolean;
    publicToken: string | null;
    contractNumber?: string | null;
  } | null;
  project: {
    name: string;
    status: string;
    statusLabel: string;
    progress: number;
  } | null;
  payments: Array<{
    id: string;
    label: string;
    amount: number;
    paidAmount: number;
    dueDate: string | null;
    status: string;
    statusLabel: string;
    statusTone: "neutral" | "accent" | "warning" | "success" | "danger";
    currency: string;
  }>;
  event: {
    eventDate: string | null;
    location: string | null;
    city: string | null;
  };
  contact: {
    providerName: string;
    email: string | null;
    phone: string | null;
    city: string | null;
  };
};

function PortalLayout({
  clientName,
  overview,
  offer,
  contract,
  project,
  payments,
  event,
  contact,
}: PortalLayoutProps) {
  return (
    <div>
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Bine ai venit,
        </p>
        <h1 className="mt-1 font-heading text-3xl font-medium text-foreground sm:text-4xl">
          {clientName}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Portalul tău personal — oferta, contractul și detaliile evenimentului, într-un singur loc.
        </p>
      </div>

      <nav className="mt-8 flex flex-wrap gap-2 border-b border-border pb-6">
        {SECTIONS.map((section) => (
          <a
            key={section.id}
            href={`#${section.id}`}
            className="flex items-center gap-1.5 rounded-full border border-border px-3.5 py-1.5 text-xs text-muted-foreground transition-colors hover:border-champagne/30 hover:text-foreground"
          >
            <section.icon className="h-3.5 w-3.5" aria-hidden />
            {section.label}
          </a>
        ))}
      </nav>

      <section id="overview" className="scroll-mt-24 py-10">
        <h2 className="font-heading text-xl font-medium text-foreground">Prezentare generală</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-3">
          <div className="surface-card p-5">
            <p className="text-xs text-muted-foreground">Tip eveniment</p>
            <p className="mt-1.5 font-heading text-lg font-medium text-foreground">
              {overview.eventType ?? "—"}
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs text-muted-foreground">Valoare</p>
            <p className="mt-1.5 font-heading text-lg font-medium text-champagne">
              {overview.totalLabel}
            </p>
            {overview.subtitle ? (
              <p className="mt-1 text-xs text-muted-soft">{overview.subtitle}</p>
            ) : null}
          </div>
          <div className="surface-card p-5">
            <p className="text-xs text-muted-foreground">Data eveniment</p>
            <p className="mt-1.5 font-heading text-lg font-medium text-foreground">
              {overview.eventDate ? formatDate(overview.eventDate) : "De stabilit"}
            </p>
          </div>
        </div>
        {project ? (
          <div className="surface-card mt-4 flex flex-wrap items-center justify-between gap-3 p-5">
            <div>
              <p className="text-xs text-muted-foreground">Status proiect — {project.name}</p>
              <p className="mt-1.5 font-heading text-lg font-medium text-foreground">
                {project.statusLabel}
              </p>
            </div>
            <div className="w-full max-w-[220px] sm:w-auto">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-elevated sm:w-40">
                <div
                  className="h-full rounded-full bg-champagne"
                  style={{ width: `${Math.min(100, Math.max(0, project.progress))}%` }}
                />
              </div>
              <p className="mt-1 text-right text-xs text-muted-soft">{project.progress}%</p>
            </div>
          </div>
        ) : null}
      </section>

      <Separator />

      <section id="offer" className="scroll-mt-24 py-10">
        <h2 className="font-heading text-xl font-medium text-foreground">Ofertă</h2>
        {offer ? (
          <div className="surface-card mt-5 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-heading text-lg font-medium text-foreground">{offer.title}</p>
                {offer.proposalNumber ? (
                  <p className="mt-1 text-xs text-muted-soft">{offer.proposalNumber}</p>
                ) : null}
                {offer.validUntil ? (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Valabilă până la {formatDate(offer.validUntil)}
                  </p>
                ) : null}
              </div>
              <StatusBadge label={offer.statusLabel} tone={offer.statusTone} />
            </div>
            <p className="mt-4 text-sm text-champagne">
              {formatCurrency(offer.total, offer.currency)}
            </p>
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">Nu există ofertă asociată momentan.</p>
        )}
      </section>

      <Separator />

      <section id="contract" className="scroll-mt-24 py-10">
        <h2 className="font-heading text-xl font-medium text-foreground">Contract</h2>
        {contract ? (
          <div className="surface-card mt-5 space-y-4 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="font-heading text-lg font-medium text-foreground">{contract.title}</p>
                {contract.contractNumber ? (
                  <p className="mt-1 text-xs text-muted-soft">{contract.contractNumber}</p>
                ) : null}
              </div>
              <StatusBadge label={contract.statusLabel} tone={contract.statusTone} />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="mt-1 text-sm text-foreground">
                  {formatCurrency(contract.total, contract.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Avans</p>
                <p className="mt-1 text-sm text-foreground">
                  {formatCurrency(contract.deposit, contract.currency)}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rest</p>
                <p className="mt-1 text-sm text-foreground">
                  {formatCurrency(contract.remaining, contract.currency)}
                </p>
              </div>
            </div>
            {contract.acceptedAt ? (
              <p className="text-xs text-muted-soft">
                Acceptat la {formatDate(contract.acceptedAt)}
              </p>
            ) : null}
            {contract.hasPublicLink && contract.publicToken ? (
              <Button
                type="button"
                variant="outline"
                size="sm"
                render={
                  <a href={`/api/c/${contract.publicToken}/pdf`} target="_blank" rel="noopener noreferrer" />
                } nativeButton={false}
              >
                <Download data-icon="inline-start" />
                Descarcă PDF contract
              </Button>
            ) : (
              <p className="text-xs text-muted-soft">
                PDF-ul contractului va fi disponibil după publicarea linkului de către furnizor.
              </p>
            )}
          </div>
        ) : (
          <p className="mt-5 text-sm text-muted-foreground">
            Contractul va apărea aici imediat după acceptarea ofertei.
          </p>
        )}
      </section>

      <Separator />

      <section id="payments" className="scroll-mt-24 py-10">
        <h2 className="font-heading text-xl font-medium text-foreground">Plăți</h2>
        {payments.length === 0 ? (
          <p className="mt-5 text-sm text-muted-foreground">
            Nu există încă un plan de plăți asociat.
          </p>
        ) : (
          <div className="surface-card mt-5 divide-y divide-border">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex flex-wrap items-center justify-between gap-3 p-4"
              >
                <div>
                  <p className="text-sm text-foreground">{payment.label}</p>
                  <p className="text-xs text-muted-soft">
                    {payment.dueDate ? `Scadent la ${formatDate(payment.dueDate)}` : "Fără scadență"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm text-foreground">
                      {formatCurrency(payment.amount, payment.currency)}
                    </p>
                    {payment.paidAmount > 0 && payment.paidAmount < payment.amount ? (
                      <p className="text-xs text-muted-soft">
                        Achitat: {formatCurrency(payment.paidAmount, payment.currency)}
                      </p>
                    ) : null}
                  </div>
                  <StatusBadge label={payment.statusLabel} tone={payment.statusTone} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Separator />

      <section id="event" className="scroll-mt-24 py-10">
        <h2 className="font-heading text-xl font-medium text-foreground">Eveniment</h2>
        <div className="surface-card mt-5 p-6">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-champagne/30 bg-champagne/10 text-champagne">
              <CalendarDays className="h-4 w-4" aria-hidden />
            </div>
            <div className="space-y-1">
              <p className="text-sm text-foreground">
                {event.eventDate ? formatDate(event.eventDate) : "Data de stabilit"}
              </p>
              {event.location ? (
                <p className="flex items-center gap-1 text-xs text-muted-soft">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {event.location}
                </p>
              ) : null}
              {event.city ? (
                <p className="text-xs text-muted-soft">{event.city}</p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <Separator />

      <section id="contact" className="scroll-mt-24 py-10">
        <h2 className="font-heading text-xl font-medium text-foreground">Contact furnizor</h2>
        <div className="surface-card mt-5 space-y-3 p-6">
          <p className="font-heading text-lg font-medium text-foreground">{contact.providerName}</p>
          {contact.email ? (
            <a
              href={`mailto:${contact.email}`}
              className="inline-flex items-center gap-2 text-sm text-champagne hover:text-champagne-soft"
            >
              <Mail className="h-4 w-4" aria-hidden />
              {contact.email}
            </a>
          ) : null}
          {contact.phone ? (
            <a
              href={`tel:${contact.phone}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Phone className="h-4 w-4" aria-hidden />
              {contact.phone}
            </a>
          ) : null}
          {contact.city ? <p className="text-xs text-muted-soft">{contact.city}</p> : null}
          <p className="text-xs text-muted-soft">
            Pentru întrebări despre ofertă, contract sau eveniment, contactează direct echipa
            studioului.
          </p>
        </div>
      </section>
    </div>
  );
}

export default async function PortalPage({ params }: PortalPageProps) {
  const { token } = await params;

  const supabase = await createClient();
  if (supabase) {
    let portal;
    let rpcError: string | null = null;
    try {
      portal = await fetchClientPortal(supabase, token);
    } catch (error) {
      rpcError = error instanceof Error ? error.message : "Eroare portal.";
      if (process.env.NODE_ENV === "development") {
        console.error("Request failed", {
          operation: "get_client_portal_by_token",
          url: "/portal/[token]",
          message: rpcError,
        });
      }
      portal = null;
    }

    if (rpcError) {
      return (
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col justify-center px-6 py-16 text-center">
          <h1 className="font-heading text-2xl font-medium text-foreground">Portal indisponibil</h1>
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

    if (portal) {
      const proposalStatus = portal.proposal?.status ?? "sent";
      const contractStatus = portal.contract?.status ?? "draft";

      return (
        <PortalLayout
          clientName={portal.client.name}
          overview={{
            eventType: portal.client.event_type,
            eventDate: portal.client.event_date ?? portal.contract?.event_date ?? null,
            totalLabel: formatCurrency(
              portal.contract?.total ?? portal.proposal?.total ?? 0,
              portal.contract?.currency ?? portal.proposal?.currency ?? "RON",
            ),
            subtitle: portal.proposal?.title ?? portal.contract?.title ?? null,
          }}
          offer={
            portal.proposal
              ? {
                  title: portal.proposal.title,
                  validUntil: portal.proposal.valid_until,
                  status: proposalStatus,
                  statusLabel: proposalStatusLabel(proposalStatus),
                  statusTone:
                    PROPOSAL_STATUS_TONE[proposalStatus as ProposalStatus] ?? "neutral",
                  total: portal.proposal.total,
                  currency: portal.proposal.currency,
                  proposalNumber: portal.proposal.proposal_number,
                }
              : null
          }
          contract={
            portal.contract
              ? {
                  title: portal.contract.title,
                  status: contractStatus,
                  statusLabel: contractStatusLabel(contractStatus),
                  statusTone:
                    CONTRACT_STATUS_TONE[contractStatus as ContractStatus] ?? "neutral",
                  total: portal.contract.total,
                  deposit: portal.contract.deposit_amount,
                  remaining: portal.contract.remaining_amount,
                  currency: portal.contract.currency,
                  eventDate: portal.contract.event_date,
                  acceptedAt: portal.contract.accepted_at,
                  hasPublicLink: portal.contract.has_public_link,
                  publicToken: null,
                }
              : null
          }
          project={
            portal.project
              ? {
                  name: portal.project.name,
                  status: portal.project.status,
                  statusLabel: projectStatusLabel(portal.project.status),
                  progress: portal.project.progress,
                }
              : null
          }
          payments={portal.payments.map((payment) => ({
            id: payment.id,
            label: payment.label,
            amount: payment.amount,
            paidAmount: payment.paid_amount,
            dueDate: payment.due_date,
            status: payment.status,
            statusLabel: paymentStatusLabel(payment.status),
            statusTone: PAYMENT_STATUS_TONE[payment.status as PaymentStatus] ?? "neutral",
            currency: payment.currency,
          }))}
          event={{
            eventDate:
              portal.project?.event_date ??
              portal.client.event_date ??
              portal.contract?.event_date ??
              null,
            location: portal.project?.location ?? null,
            city: portal.client.city ?? portal.provider.city,
          }}
          contact={{
            providerName: portal.provider.name,
            email: null,
            phone: null,
            city: portal.provider.city,
          }}
        />
      );
    }
  }

  notFound();
}
