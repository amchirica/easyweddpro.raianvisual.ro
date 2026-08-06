"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  Ban,
  Copy,
  ExternalLink,
  FileCheck2,
  Files,
  PackageOpen,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ProposalForm,
  type ProposalFormInitialData,
  type ProposalFormOption,
} from "@/components/proposals/proposal-form";
import {
  cancelProposalAction,
  convertProposalToContractAction,
  deleteProposalAction,
  duplicateProposalAction,
  publishProposalAction,
} from "@/lib/actions/proposals";
import { PROPOSAL_STATUS_LABELS, type ProposalStatus } from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import type { DiscountType } from "@/lib/proposals/money";
import { canEditProposal } from "@/lib/proposals/status";

export type ProposalDetailItem = {
  id: string;
  name: string;
  description: string | null;
  quantity: number;
  unitPrice: number;
  discount: number;
  lineTotal: number;
};

export type ProposalDetailData = {
  id: string;
  proposalNumber: string | null;
  title: string;
  status: string;
  effectiveStatus: ProposalStatus;
  currency: string;
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  validUntil: string | null;
  notes: string | null;
  terms: string | null;
  publicToken: string | null;
  contractId: string | null;
  clientId: string | null;
  clientName: string | null;
  leadId: string | null;
  leadName: string | null;
  createdAt: string;
  updatedAt: string;
};

const PROPOSAL_STATUS_TONE: Record<ProposalStatus, "neutral" | "accent" | "warning" | "success" | "danger"> = {
  draft: "neutral",
  sent: "accent",
  viewed: "warning",
  accepted: "success",
  rejected: "danger",
  expired: "neutral",
  cancelled: "danger",
};

type ProposalDetailProps = {
  proposal: ProposalDetailData;
  items: ProposalDetailItem[];
  mode: "live" | "demo";
  canWrite: boolean;
  canDelete: boolean;
  canWriteContracts: boolean;
  clients: ProposalFormOption[];
  leads: ProposalFormOption[];
};

export function ProposalDetail({
  proposal,
  items,
  mode,
  canWrite,
  canDelete,
  canWriteContracts,
  clients,
  leads,
}: ProposalDetailProps) {
  const [editing, setEditing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [converting, setConverting] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [copiedPublicPath, setCopiedPublicPath] = useState<string | null>(
    proposal.publicToken && proposal.status !== "draft" ? `/p/${proposal.publicToken}` : null,
  );
  const router = useRouter();
  const { toast } = useToast();

  function requireLive(message: string): boolean {
    if (mode !== "live") {
      toast(message, "info");
      return false;
    }
    return true;
  }

  async function handlePublish() {
    if (!requireLive("Publicarea ofertelor necesită un cont conectat.")) return;
    setPublishing(true);
    const result = await publishProposalAction(proposal.id);
    setPublishing(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Ofertă publicată.", "success");
    if (result?.data?.publicUrlPath) {
      setCopiedPublicPath(result.data.publicUrlPath);
    }
    router.refresh();
  }

  async function handleCopyLink() {
    const path = copiedPublicPath ?? (proposal.publicToken ? `/p/${proposal.publicToken}` : null);
    if (!path) return;
    const url = `${window.location.origin}${path}`;
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copiat în clipboard.", "success");
    } catch {
      toast("Nu am putut copia linkul.", "error");
    }
  }

  async function handleDuplicate() {
    if (!requireLive("Duplicarea ofertelor necesită un cont conectat.")) return;
    setDuplicating(true);
    const result = await duplicateProposalAction(proposal.id);
    setDuplicating(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Ofertă duplicată.", "success");
    if (result?.data?.proposalId) {
      router.push(`/dashboard/proposals/${result.data.proposalId}`);
    }
  }

  async function handleCancel() {
    if (!requireLive("Anularea ofertelor necesită un cont conectat.")) {
      setCancelOpen(false);
      return;
    }
    setCancelling(true);
    const result = await cancelProposalAction(proposal.id);
    setCancelling(false);
    setCancelOpen(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Ofertă anulată.", "success");
    router.refresh();
  }

  async function handleDelete() {
    if (!requireLive("Ștergerea ofertelor necesită un cont conectat.")) {
      setDeleteOpen(false);
      return;
    }
    setDeleting(true);
    const result = await deleteProposalAction(proposal.id);
    setDeleting(false);

    if (result?.error) {
      toast(result.error, "error");
      setDeleteOpen(false);
      return;
    }
    toast(result?.success ?? "Ofertă ștearsă.", "success");
    router.push("/dashboard/proposals");
  }

  async function handleConvert() {
    if (!requireLive("Conversia în contract necesită un cont conectat.")) return;
    setConverting(true);
    const result = await convertProposalToContractAction(proposal.id);
    setConverting(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Contract creat.", "success");
    if (result?.data?.contractId) {
      router.push(`/dashboard/contracts/${result.data.contractId}?edit=1`);
    }
  }

  function handleEditClick() {
    if (!requireLive("Editarea ofertelor necesită un cont conectat.")) return;
    setEditing(true);
  }

  const canShowEdit = canWrite && canEditProposal(proposal.effectiveStatus);
  const canShowPublish =
    canWrite &&
    (proposal.effectiveStatus === "draft" ||
      proposal.effectiveStatus === "sent" ||
      proposal.effectiveStatus === "viewed" ||
      proposal.effectiveStatus === "expired");
  const canShowCancel =
    canWrite && proposal.effectiveStatus !== "accepted" && proposal.effectiveStatus !== "cancelled";
  const canShowDelete =
    canDelete && (proposal.status === "draft" || proposal.status === "cancelled");
  const canShowConvert = canWriteContracts && proposal.effectiveStatus === "accepted";
  const hasPublicLink = Boolean(copiedPublicPath ?? (proposal.publicToken && proposal.status !== "draft"));

  if (editing) {
    const initial: ProposalFormInitialData = {
      title: proposal.title,
      clientId: proposal.clientId,
      leadId: proposal.leadId,
      currency: proposal.currency,
      discountType: proposal.discountType,
      discountValue: proposal.discountValue,
      taxRate: proposal.taxRate,
      validUntil: proposal.validUntil,
      notes: proposal.notes,
      terms: proposal.terms,
      items: items.map((item) => ({
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
      })),
    };

    return (
      <div className="space-y-6">
        <Link
          href="/dashboard/proposals"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
          Înapoi la oferte
        </Link>
        <ProposalForm
          mode="edit"
          proposalId={proposal.id}
          initial={initial}
          clients={clients}
          leads={leads}
          currency={proposal.currency}
          canWrite={canWrite}
          onCancelEdit={() => setEditing(false)}
          onSaved={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/proposals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Înapoi la oferte
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-medium text-foreground">{proposal.title}</h1>
            <StatusBadge
              label={PROPOSAL_STATUS_LABELS[proposal.effectiveStatus]}
              tone={PROPOSAL_STATUS_TONE[proposal.effectiveStatus]}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {proposal.proposalNumber ?? "Fără număr"} · {proposal.clientName ?? proposal.leadName ?? "Fără destinatar"}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canShowEdit ? (
            <Button type="button" variant="outline" size="sm" onClick={handleEditClick}>
              <Pencil data-icon="inline-start" />
              Editează
            </Button>
          ) : null}
          {canShowPublish ? (
            <Button type="button" variant="outline" size="sm" onClick={handlePublish} disabled={publishing}>
              <Send data-icon="inline-start" />
              {publishing ? "Se publică…" : "Publică"}
            </Button>
          ) : null}
          {hasPublicLink ? (
            <Button type="button" variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy data-icon="inline-start" />
              Copiază link
            </Button>
          ) : null}
          <Button type="button" variant="outline" size="sm" onClick={handleDuplicate} disabled={duplicating}>
            <Files data-icon="inline-start" />
            {duplicating ? "Se duplică…" : "Duplică"}
          </Button>
          {canShowConvert ? (
            <Button type="button" size="sm" onClick={handleConvert} disabled={converting}>
              <FileCheck2 data-icon="inline-start" />
              {converting ? "Se convertește…" : "Convertește în contract"}
            </Button>
          ) : proposal.contractId ? (
            <Button type="button" variant="outline" size="sm" render={<Link href={`/dashboard/contracts/${proposal.contractId}`} />} nativeButton={false}>
              <FileCheck2 data-icon="inline-start" />
              Vezi contract
            </Button>
          ) : null}
          {canShowCancel ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
              <Ban data-icon="inline-start" />
              Anulează
            </Button>
          ) : null}
          {canShowDelete ? (
            <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
              <Trash2 data-icon="inline-start" />
              Șterge
            </Button>
          ) : null}
        </div>
      </div>

      {hasPublicLink && copiedPublicPath ? (
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Link public</p>
            <p className="truncate text-sm text-foreground">{copiedPublicPath}</p>
          </div>
          <Link
            href={copiedPublicPath}
            target="_blank"
            className="inline-flex items-center gap-1.5 text-sm text-champagne hover:text-champagne-soft"
          >
            Deschide
            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
          </Link>
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface-card space-y-3 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Destinatar
          </p>
          {proposal.clientId ? (
            <Link
              href={`/dashboard/clients/${proposal.clientId}`}
              className="text-sm text-champagne hover:text-champagne-soft"
            >
              {proposal.clientName ?? "Vezi client"}
            </Link>
          ) : proposal.leadId ? (
            <Link
              href={`/dashboard/leads/${proposal.leadId}`}
              className="text-sm text-champagne hover:text-champagne-soft"
            >
              {proposal.leadName ?? "Vezi lead"}
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">Fără destinatar asociat</p>
          )}
        </div>

        <div className="surface-card space-y-3 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Valabilitate
          </p>
          <p className="text-sm text-foreground">
            {proposal.validUntil ? formatDate(proposal.validUntil) : "Fără termen limită"}
          </p>
          <p className="text-xs text-muted-soft">Creată {formatDateTime(proposal.createdAt)}</p>
        </div>

        <div className="surface-card space-y-3 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Valoare totală
          </p>
          <p className="font-heading text-2xl font-medium text-champagne">
            {formatCurrency(proposal.total, proposal.currency)}
          </p>
          <p className="text-xs text-muted-soft">
            Subtotal {formatCurrency(proposal.subtotal, proposal.currency)}
          </p>
        </div>
      </div>

      <div className="surface-card space-y-4 p-5">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
          Items ofertă
        </p>
        {items.length === 0 ? (
          <EmptyState icon={PackageOpen} title="Niciun item" description="Această ofertă nu are items adăugate." />
        ) : (
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.id} className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  {item.description ? (
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  ) : null}
                  <p className="mt-1 text-xs text-muted-soft">
                    {item.quantity} × {formatCurrency(item.unitPrice, proposal.currency)}
                    {item.discount > 0 ? ` − ${formatCurrency(item.discount, proposal.currency)}` : ""}
                  </p>
                </div>
                <p className="shrink-0 text-sm font-medium text-foreground">
                  {formatCurrency(item.lineTotal, proposal.currency)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-1.5 border-t border-border pt-3 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="text-foreground">{formatCurrency(proposal.subtotal, proposal.currency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Discount</span>
            <span className="text-foreground">
              -{formatCurrency(proposal.discountAmount, proposal.currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">TVA ({proposal.taxRate}%)</span>
            <span className="text-foreground">{formatCurrency(proposal.taxAmount, proposal.currency)}</span>
          </div>
          <div className="flex items-center justify-between border-t border-border pt-2">
            <span className="font-medium text-foreground">Total</span>
            <span className="font-heading text-lg font-medium text-champagne">
              {formatCurrency(proposal.total, proposal.currency)}
            </span>
          </div>
        </div>
      </div>

      {proposal.terms ? (
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Termeni și condiții
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{proposal.terms}</p>
        </div>
      ) : null}

      {proposal.notes ? (
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Notițe interne
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{proposal.notes}</p>
        </div>
      ) : null}

      <Dialog open={cancelOpen} onOpenChange={(next) => !cancelling && setCancelOpen(next)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Anulezi această ofertă?</DialogTitle>
            <DialogDescription>
              Oferta va fi marcată drept anulată și nu va mai putea fi acceptată de client.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelling}>
              Renunță
            </Button>
            <Button type="button" variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Se anulează…" : "Anulează oferta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={(next) => !deleting && setDeleteOpen(next)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Ștergi această ofertă?</DialogTitle>
            <DialogDescription>Această acțiune nu poate fi anulată.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)} disabled={deleting}>
              Anulează
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Se șterge…" : "Șterge oferta"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
