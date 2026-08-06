"use client";

import { useState, type FormEvent } from "react";
import {
  Ban,
  CalendarClock,
  Clock,
  Download,
  FileText,
  Loader2,
  MapPin,
  ScrollText,
  ShieldCheck,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { acceptPublicContractAction } from "@/lib/actions/contracts";
import { CONTRACT_STATUS_LABELS, type ContractStatus } from "@/lib/constants";
import type { ContractSections, ContractServiceItem } from "@/lib/contracts/content";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export type PublicContractViewData = {
  contractNumber: string | null;
  title: string;
  status: ContractStatus;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  depositAmount: number;
  remainingAmount: number;
  eventDate: string | null;
  eventLocation: string | null;
  validUntil: string | null;
  publishedAt: string | null;
  acceptedAt: string | null;
  terms: string | null;
  providerName: string | null;
  clientName: string | null;
  services: ContractServiceItem[];
  sections: ContractSections;
  documentHash: string | null;
  version: number;
};

type PublicContractViewProps = {
  token: string;
  data: PublicContractViewData;
  demo: boolean;
  loading?: boolean;
  error?: string | null;
};

const SECTION_LABELS: Partial<Record<keyof ContractSections, string>> = {
  introduction: "Introducere",
  object: "Obiectul contractului",
  provider_obligations: "Obligațiile furnizorului",
  client_obligations: "Obligațiile clientului",
  products: "Produse",
  schedule: "Program",
  access_logistics: "Acces și logistică",
  transport: "Transport",
  setup_teardown: "Montaj și demontaj",
  delivery: "Livrare",
  payments: "Plăți",
  deposit_terms: "Avans",
  installments_terms: "Tranșe",
  cancellation: "Anulare",
  reschedule: "Reprogramare",
  force_majeure: "Forță majoră",
  liability: "Răspundere",
  copyright: "Drepturi de autor",
  privacy: "Protecția datelor",
  special_clauses: "Clauze speciale",
  notes: "Observații",
};

export function PublicContractView({
  token,
  data,
  demo,
  loading = false,
  error = null,
}: PublicContractViewProps) {
  const [status, setStatus] = useState<ContractStatus>(data.status);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedPrivacy, setAcceptedPrivacy] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const canAccept = status === "published" || status === "viewed";

  async function handleAccept(event: FormEvent) {
    event.preventDefault();
    if (submitting || !canAccept) return;

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError("Introdu numele tău complet.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError("Introdu o adresă de email validă.");
      return;
    }
    if (!acceptedTerms) {
      setFormError("Trebuie să accepți termenii contractului.");
      return;
    }
    if (!acceptedPrivacy) {
      setFormError("Trebuie să accepți politica de confidențialitate.");
      return;
    }
    setFormError(null);

    if (demo) {
      setSubmitting(true);
      window.setTimeout(() => {
        setSubmitting(false);
        setStatus("accepted");
        toast("Acceptare simulată — mod demo, nu este salvată.", "info");
      }, 400);
      return;
    }

    setSubmitting(true);
    const result = await acceptPublicContractAction({
      token,
      fullName: fullName.trim(),
      email: email.trim(),
      acceptedTerms: true,
      acceptedPrivacy: true,
      documentHash: data.documentHash,
    });
    setSubmitting(false);

    if (result?.error) {
      setFormError(result.error);
      toast(result.error, "error");
      return;
    }

    toast(result?.success ?? "Contract acceptat digital. Mulțumim!", "success");
    setStatus("accepted");
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-14">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-champagne" aria-hidden />
          <p className="text-sm text-muted-foreground">Se încarcă contractul…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 py-14">
        <div className="surface-card max-w-md p-8 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-6 py-14">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[480px] bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,rgba(198,167,106,0.14),transparent)]"
      />
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            {data.providerName ? (
              <p className="font-heading text-lg font-medium text-foreground">{data.providerName}</p>
            ) : null}
            <div className="mt-1 opacity-80">
              <BrandLogo size="sm" href="" showWordmark />
            </div>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/10 px-3 py-1 text-xs font-medium text-champagne-soft">
            {CONTRACT_STATUS_LABELS[status]}
          </span>
        </div>

        {demo ? (
          <div
            className="mb-6 rounded-xl border border-champagne/30 bg-champagne/10 px-4 py-2.5 text-sm text-champagne-soft"
            role="status"
          >
            Pagină demonstrativă — acceptarea ta nu este salvată.
          </div>
        ) : null}

        <div className="surface-card p-8 sm:p-10">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Contract {data.contractNumber ? `· ${data.contractNumber}` : ""}
            {data.version > 1 ? ` · v${data.version}` : ""}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-medium text-foreground sm:text-4xl">
            {data.title}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Între {data.providerName ?? "Furnizor"} și {data.clientName ?? "Client"}
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-elevated/60 p-4">
              <p className="text-xs text-muted-foreground">Valoare totală</p>
              <p className="mt-1 font-heading text-lg font-medium text-champagne">
                {formatCurrency(data.total, data.currency)}
              </p>
              <p className="mt-1 text-xs text-muted-soft">
                Avans {formatCurrency(data.depositAmount, data.currency)} · Rest{" "}
                {formatCurrency(data.remainingAmount, data.currency)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated/60 p-4">
              <p className="text-xs text-muted-foreground">Eveniment</p>
              <p className="mt-1 flex items-center gap-1.5 font-heading text-lg font-medium text-foreground">
                <CalendarClock className="h-4 w-4 text-champagne" aria-hidden />
                {data.eventDate ? formatDate(data.eventDate) : "De stabilit"}
              </p>
              {data.eventLocation ? (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-soft">
                  <MapPin className="h-3 w-3" aria-hidden />
                  {data.eventLocation}
                </p>
              ) : null}
            </div>
          </div>

          {data.validUntil ? (
            <p className="mt-4 text-sm text-muted-foreground">
              Acceptare disponibilă până la {formatDate(data.validUntil)}.
            </p>
          ) : null}

          <Separator className="my-8" />

          <div>
            <p className="flex items-center gap-2 font-heading text-lg font-medium text-foreground">
              <ScrollText className="h-4 w-4 text-champagne" aria-hidden />
              Servicii contractate
            </p>

            <div className="mt-4 hidden overflow-x-auto sm:block">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground uppercase">
                    <th className="py-2 pr-3 font-medium">Serviciu</th>
                    <th className="py-2 pr-3 font-medium">Cant.</th>
                    <th className="py-2 pr-3 font-medium">Preț unitar</th>
                    <th className="py-2 font-medium text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.services.map((item, index) => (
                    <tr key={`${item.name}-${index}`}>
                      <td className="py-3 pr-3 text-foreground">{item.name}</td>
                      <td className="py-3 pr-3 text-muted-foreground">{item.quantity}</td>
                      <td className="py-3 pr-3 text-muted-foreground">
                        {formatCurrency(item.unitPrice, data.currency)}
                      </td>
                      <td className="py-3 text-right text-foreground">
                        {formatCurrency(item.lineTotal, data.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <ul className="mt-4 space-y-3 sm:hidden">
              {data.services.map((item, index) => (
                <li
                  key={`${item.name}-mobile-${index}`}
                  className="rounded-xl border border-border bg-surface-elevated/40 p-4 text-sm"
                >
                  <p className="font-medium text-foreground">{item.name}</p>
                  <p className="mt-1 text-xs text-muted-soft">
                    {item.quantity} × {formatCurrency(item.unitPrice, data.currency)}
                  </p>
                  <p className="mt-2 text-foreground">
                    {formatCurrency(item.lineTotal, data.currency)}
                  </p>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">
                  {formatCurrency(data.subtotal, data.currency)}
                </span>
              </div>
              {data.discountAmount > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-foreground">
                    -{formatCurrency(data.discountAmount, data.currency)}
                  </span>
                </div>
              ) : null}
              {data.taxAmount > 0 ? (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Taxe</span>
                  <span className="text-foreground">
                    {formatCurrency(data.taxAmount, data.currency)}
                  </span>
                </div>
              ) : null}
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="font-medium text-foreground">Total</span>
                <span className="font-heading text-xl font-medium text-champagne">
                  {formatCurrency(data.total, data.currency)}
                </span>
              </div>
            </div>
          </div>

          {(Object.keys(SECTION_LABELS) as Array<keyof ContractSections>).map((key) => {
            const body = data.sections[key];
            if (!body?.trim()) return null;
            return (
              <div key={key}>
                <Separator className="my-8" />
                <div>
                  <p className="font-heading text-lg font-medium text-foreground">
                    {SECTION_LABELS[key]}
                  </p>
                  <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">{body}</p>
                </div>
              </div>
            );
          })}

          {data.terms ? (
            <>
              <Separator className="my-8" />
              <div>
                <p className="flex items-center gap-2 font-heading text-lg font-medium text-foreground">
                  <FileText className="h-4 w-4 text-champagne" aria-hidden />
                  Termeni generali
                </p>
                <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">{data.terms}</p>
              </div>
            </>
          ) : null}

          <Separator className="my-8" />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-soft">
              {data.documentHash ? `ID document: ${data.documentHash.slice(0, 16)}…` : null}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              render={
                <a href={`/api/c/${token}/pdf`} target="_blank" rel="noopener noreferrer" />
              } nativeButton={false}
            >
              <Download data-icon="inline-start" />
              Descarcă PDF
            </Button>
          </div>

          <Separator className="my-8" />

          {status === "accepted" ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <ShieldCheck className="h-6 w-6 text-success" aria-hidden />
              <p className="text-sm font-medium text-success">Contract acceptat digital.</p>
              {data.acceptedAt ? (
                <p className="text-xs text-muted-soft">{formatDateTime(data.acceptedAt)}</p>
              ) : null}
            </div>
          ) : status === "cancelled" ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <Ban className="h-6 w-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Acest contract a fost anulat de furnizor.
              </p>
            </div>
          ) : status === "expired" ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <Clock className="h-6 w-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">Termenul de acceptare a expirat.</p>
            </div>
          ) : status === "superseded" ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <Clock className="h-6 w-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                Această versiune a fost înlocuită de un contract nou.
              </p>
            </div>
          ) : canAccept ? (
            <form onSubmit={handleAccept} className="mx-auto max-w-md space-y-4">
              <p className="text-center text-sm text-muted-foreground">
                Completează datele tale pentru a accepta digital acest contract.
              </p>
              <div className="space-y-2">
                <Label htmlFor="accept-name">Nume complet</Label>
                <Input
                  id="accept-name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                  placeholder="Numele tău complet"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="accept-email">Email</Label>
                <Input
                  id="accept-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="nume@email.com"
                />
              </div>
              <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Checkbox
                  checked={acceptedTerms}
                  onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                  className="mt-0.5"
                />
                Am citit și sunt de acord cu termenii și clauzele acestui contract.
              </label>
              <label className="flex items-start gap-2.5 text-sm text-muted-foreground">
                <Checkbox
                  checked={acceptedPrivacy}
                  onCheckedChange={(checked) => setAcceptedPrivacy(checked === true)}
                  className="mt-0.5"
                />
                Am citit și accept politica de confidențialitate privind prelucrarea datelor.
              </label>
              <p className="rounded-md border border-border bg-surface-elevated/50 px-3 py-2 text-xs text-muted-soft">
                Acceptarea digitală înregistrează identitatea declarată, data și informațiile tehnice
                ale sesiunii. Nu reprezintă o semnătură electronică calificată în sensul eIDAS.
              </p>

              {formError ? (
                <p
                  className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                  role="alert"
                >
                  {formError}
                </p>
              ) : null}

              <div className="flex justify-center">
                <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting}>
                  {submitting ? "Se trimite…" : "Accept contractul"}
                </Button>
              </div>
            </form>
          ) : null}
        </div>

        <p className="mt-8 text-center text-xs text-muted-soft">
          Publicat de {data.providerName ?? "EasyWedd Pro"}
          {data.publishedAt ? ` · ${formatDateTime(data.publishedAt)}` : ""}
        </p>
      </div>
    </div>
  );
}
