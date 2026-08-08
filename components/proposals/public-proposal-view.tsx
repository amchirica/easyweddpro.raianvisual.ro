"use client";

import { useState, type FormEvent } from "react";
import {
  Ban,
  CalendarClock,
  Check,
  Clock,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

import { BrandLogo } from "@/components/brand/brand-logo";
import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { acceptPublicProposalAction, rejectPublicProposalAction } from "@/lib/actions/proposals";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export type PublicProposalItem = {
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
};

export type PublicProposalStatus = "sent" | "viewed" | "accepted" | "rejected" | "expired" | "cancelled";

export type PublicProposalViewData = {
  proposalNumber: string | null;
  title: string;
  status: PublicProposalStatus;
  currency: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  validUntil: string | null;
  createdAt: string;
  terms: string | null;
  notes: string | null;
  clientName: string | null;
  providerName: string | null;
  items: PublicProposalItem[];
};

type PublicProposalViewProps = {
  token: string;
  data: PublicProposalViewData;
  demo: boolean;
};

const STATUS_KEYS: Record<PublicProposalStatus, string> = {
  sent: "portal.sent",
  viewed: "portal.viewed",
  accepted: "portal.accepted",
  rejected: "portal.declined",
  expired: "portal.expired",
  cancelled: "status.proposal.declined",
};

export function PublicProposalView({ token, data, demo }: PublicProposalViewProps) {
  const { t } = useI18n();
  const [status, setStatus] = useState<PublicProposalStatus>(data.status);
  const [showReject, setShowReject] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { toast } = useToast();

  const canRespond = status === "sent" || status === "viewed";

  async function handleAccept(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (!fullName.trim() || fullName.trim().length < 2) {
      setFormError(t("portal.enterFullName"));
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setFormError(t("portal.enterValidEmail"));
      return;
    }
    if (!acceptedTerms) {
      setFormError(t("portal.mustAcceptTerms"));
      return;
    }
    setFormError(null);

    if (demo) {
      setSubmitting(true);
      window.setTimeout(() => {
        setSubmitting(false);
        setStatus("accepted");
        toast(t("portal.acceptDemo"), "info");
      }, 400);
      return;
    }

    setSubmitting(true);
    const result = await acceptPublicProposalAction({
      token,
      fullName: fullName.trim(),
      email: email.trim(),
      acceptedTerms,
    });
    setSubmitting(false);

    if (result?.error) {
      setFormError(result.error);
      toast(result.error, "error");
      return;
    }

    toast(result?.success ?? t("portal.acceptedThanks"), "success");
    setStatus("accepted");
  }

  async function handleReject() {
    if (submitting) return;

    if (demo) {
      setSubmitting(true);
      window.setTimeout(() => {
        setSubmitting(false);
        setStatus("rejected");
        toast(t("portal.rejectDemo"), "info");
      }, 400);
      return;
    }

    setSubmitting(true);
    const result = await rejectPublicProposalAction({ token, reason });
    setSubmitting(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }

    toast(result?.success ?? t("portal.rejectedThanks"), "success");
    setStatus("rejected");
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
            {t(STATUS_KEYS[status])}
          </span>
        </div>

        {demo ? (
          <div
            className="mb-6 rounded-xl border border-champagne/30 bg-champagne/10 px-4 py-2.5 text-sm text-champagne-soft"
            role="status"
          >
            {t("portal.demoPageProposal")}
          </div>
        ) : null}

        <div className="surface-card p-8 sm:p-10">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {data.proposalNumber ? t("portal.proposalFor", { number: `· ${data.proposalNumber}` }) : t("portal.proposalForPlain")}
          </p>
          <h1 className="mt-2 font-heading text-3xl font-medium text-foreground sm:text-4xl">
            {data.clientName ?? "Client"}
          </h1>
          <p className="mt-2 text-base text-muted-foreground">{data.title}</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-elevated/60 p-4">
              <p className="text-xs text-muted-foreground">{t("portal.totalValue")}</p>
              <p className="mt-1 font-heading text-lg font-medium text-champagne">
                {formatCurrency(data.total, data.currency)}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-elevated/60 p-4">
              <p className="text-xs text-muted-foreground">{t("portal.validUntil")}</p>
              <p className="mt-1 flex items-center gap-1.5 font-heading text-lg font-medium text-foreground">
                <CalendarClock className="h-4 w-4 text-champagne" aria-hidden />
                {data.validUntil ? formatDate(data.validUntil) : t("portal.noDeadline")}
              </p>
            </div>
          </div>

          <Separator className="my-8" />

          <div>
            <p className="flex items-center gap-2 font-heading text-lg font-medium text-foreground">
              <Sparkles className="h-4 w-4 text-champagne" aria-hidden />
              {t("portal.includes")}
            </p>
            <ul className="mt-4 space-y-3">
              {data.items.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex items-start justify-between gap-3 text-sm">
                  <div className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-champagne" aria-hidden />
                    <div>
                      <p className="text-foreground">{item.name}</p>
                      {item.description ? (
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                      ) : null}
                      <p className="text-xs text-muted-soft">
                        {item.quantity} × {formatCurrency(item.unitPrice, data.currency)}
                      </p>
                    </div>
                  </div>
                  <span className="shrink-0 text-foreground">
                    {formatCurrency(item.lineTotal, data.currency)}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-6 space-y-1.5 border-t border-border pt-4 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("portal.subtotal")}</span>
                <span className="text-foreground">{formatCurrency(data.subtotal, data.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("portal.discount")}</span>
                <span className="text-foreground">-{formatCurrency(data.discountAmount, data.currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("portal.tax")}</span>
                <span className="text-foreground">{formatCurrency(data.taxAmount, data.currency)}</span>
              </div>
              <div className="flex items-center justify-between border-t border-border pt-2">
                <span className="font-medium text-foreground">{t("portal.total")}</span>
                <span className="font-heading text-xl font-medium text-champagne">
                  {formatCurrency(data.total, data.currency)}
                </span>
              </div>
            </div>
          </div>

          {data.terms ? (
            <>
              <Separator className="my-8" />
              <div>
                <p className="font-heading text-lg font-medium text-foreground">{t("portal.terms")}</p>
                <p className="mt-3 text-sm whitespace-pre-wrap text-muted-foreground">{data.terms}</p>
              </div>
            </>
          ) : null}

          <Separator className="my-8" />

          {status === "accepted" ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <ShieldCheck className="h-6 w-6 text-success" aria-hidden />
              <p className="text-sm font-medium text-success">
                {t("portal.acceptedReady")}
              </p>
            </div>
          ) : status === "rejected" ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <XCircle className="h-6 w-6 text-destructive" aria-hidden />
              <p className="text-sm font-medium text-destructive">{t("portal.youDeclined")}</p>
            </div>
          ) : status === "cancelled" ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <Ban className="h-6 w-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">
                {t("portal.cancelledByProvider")}
              </p>
            </div>
          ) : status === "expired" ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <Clock className="h-6 w-6 text-muted-foreground" aria-hidden />
              <p className="text-sm text-muted-foreground">{t("portal.expiredNotice")}</p>
            </div>
          ) : canRespond ? (
            showReject ? (
              <div className="space-y-4">
                <p className="text-sm font-medium text-foreground">{t("portal.rejectReason")}</p>
                <Textarea
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  rows={3}
                  placeholder={t("portal.rejectReasonPh")}
                />
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <Button type="button" variant="outline" onClick={() => setShowReject(false)} disabled={submitting}>
                    {t("common.back")}
                  </Button>
                  <Button type="button" variant="destructive" onClick={handleReject} disabled={submitting}>
                    {submitting ? t("portal.sending") : t("portal.confirmReject")}
                  </Button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleAccept} className="mx-auto max-w-md space-y-4">
                <p className="text-center text-sm text-muted-foreground">
                  {t("portal.acceptFormIntro")}
                </p>
                <div className="space-y-2">
                  <Label htmlFor="accept-name">{t("portal.fullName")}</Label>
                  <Input
                    id="accept-name"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder={t("portal.fullNamePh")}
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
                  {t("portal.acceptTerms")}
                </label>

                {formError ? (
                  <p
                    className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
                    role="alert"
                  >
                    {formError}
                  </p>
                ) : null}

                <div className="flex flex-col items-center gap-3">
                  <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={submitting}>
                    {submitting ? t("common.loading") : t("portal.acceptProposal")}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowReject(true)}
                    className="text-xs text-muted-soft underline-offset-4 hover:text-foreground hover:underline"
                    disabled={submitting}
                  >
                    {t("portal.declineProposal")}
                  </button>
                </div>
              </form>
            )
          ) : null}
        </div>

        <p className="mt-8 text-center text-xs text-muted-soft">
          {t("portal.sentBy", { provider: data.providerName ?? "EasyWedd Pro", date: formatDateTime(data.createdAt) })}
        </p>
      </div>
    </div>
  );
}
