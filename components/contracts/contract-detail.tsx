"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Copy,
  Download,
  ExternalLink,
  Files,
  FolderKanban,
  Globe,
  Pencil,
  Plus,
  Send,
} from "lucide-react";

import { ContractEditor, type ContractEditorInitialData } from "@/components/contracts/contract-editor";
import { ContractStatusStepper } from "@/components/contracts/contract-status-stepper";
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
  cancelContractAction,
  createContractVersionAction,
  createPortalTokenAction,
  duplicateContractAction,
  publishContractAction,
} from "@/lib/actions/contracts";
import { createProjectFromContractAction } from "@/lib/actions/projects";
import { CONTRACT_STATUS_LABELS, type ContractStatus } from "@/lib/constants";
import type { ContractSections } from "@/lib/contracts/content";
import {
  hasUnresolvedCriticalPlaceholders,
  type TemplateVariableValues,
} from "@/lib/contracts/templates";
import {
  canCancelContract,
  canCreateNewVersion,
  canEditContract,
  canPublishContract,
} from "@/lib/contracts/status";
import type { ContractDetailData } from "@/lib/contracts/types";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export type { ContractDetailData };

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

type ContractDetailProps = {
  contract: ContractDetailData;
  mode: "live" | "demo";
  canWrite: boolean;
  openEditor?: boolean;
};

function templateValuesFromContract(contract: ContractDetailData): TemplateVariableValues {
  return {
    client_name: contract.content.client.name,
    client_email: contract.content.client.email ?? "",
    client_phone: contract.content.client.phone ?? "",
    company_name: contract.content.provider.name,
    company_email: contract.content.provider.email ?? "",
    company_phone: contract.content.provider.phone ?? "",
    event_date: contract.eventDate ?? "",
    event_location: contract.eventLocation ?? contract.content.eventLocation ?? "",
    contract_number: contract.contractNumber ?? "",
    proposal_number: contract.proposalNumber ?? "",
    total: String(contract.total),
    deposit: String(contract.depositAmount),
    remaining: String(contract.remainingAmount),
    currency: contract.currency,
  };
}

export function ContractDetail({
  contract,
  mode,
  canWrite,
  openEditor = false,
}: ContractDetailProps) {
  const [publishing, setPublishing] = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [versioning, setVersioning] = useState(false);
  const [portalBusy, setPortalBusy] = useState(false);
  const [creatingProject, setCreatingProject] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [copiedPublicPath, setCopiedPublicPath] = useState<string | null>(
    contract.publicToken && contract.status !== "draft" ? `/c/${contract.publicToken}` : null,
  );
  const router = useRouter();
  const { toast } = useToast();

  const canEdit = canWrite && canEditContract(contract.effectiveStatus);

  useEffect(() => {
    if (!openEditor || !canEdit) return;
    const node = document.getElementById("contract-editor");
    node?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [openEditor, canEdit]);

  const editorInitial: ContractEditorInitialData = {
    title: contract.title,
    currency: contract.currency,
    eventDate: contract.eventDate,
    eventLocation: contract.eventLocation,
    validUntil: contract.validUntil,
    terms: contract.terms,
    subtotal: contract.subtotal,
    discountAmount: contract.discountAmount,
    taxAmount: contract.taxAmount,
    total: contract.total,
    depositAmount: contract.depositAmount,
    provider: contract.content.provider,
    client: contract.content.client,
    services: contract.content.services,
    sections: contract.content.sections,
    customSections: contract.content.customSections ?? [],
  };

  const canPublish = canWrite && canPublishContract(contract.effectiveStatus);
  const canCancel = canWrite && canCancelContract(contract.effectiveStatus);
  const canVersion = canWrite && canCreateNewVersion(contract.effectiveStatus);
  const hasPublicLink = Boolean(copiedPublicPath ?? (contract.publicToken && contract.status !== "draft"));

  const unresolvedCritical = useMemo(() => {
    if (!canPublish) return [];
    const values = templateValuesFromContract(contract);
    const texts = [
      contract.terms ?? "",
      contract.content.sections.provider_obligations,
      contract.content.sections.client_obligations,
      contract.content.sections.delivery,
      contract.content.sections.cancellation,
      contract.content.sections.force_majeure,
      contract.content.sections.copyright,
      contract.content.sections.privacy,
      contract.content.sections.special_clauses,
      contract.content.sections.notes ?? "",
    ];
    return hasUnresolvedCriticalPlaceholders(texts, values);
  }, [canPublish, contract]);

  function requireLive(message: string): boolean {
    if (mode !== "live") {
      toast(message, "info");
      return false;
    }
    return true;
  }

  async function handlePublish() {
    if (!requireLive("Publicarea contractelor necesită un cont conectat.")) {
      setPublishOpen(false);
      return;
    }
    setPublishing(true);
    const result = await publishContractAction(contract.id);
    setPublishing(false);
    setPublishOpen(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Contract publicat.", "success");
    if (result?.data?.publicUrlPath) {
      setCopiedPublicPath(result.data.publicUrlPath);
    }
    router.refresh();
  }

  async function handleCopyLink() {
    const path = copiedPublicPath ?? (contract.publicToken ? `/c/${contract.publicToken}` : null);
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
    if (!requireLive("Duplicarea contractelor necesită un cont conectat.")) return;
    setDuplicating(true);
    const result = await duplicateContractAction(contract.id);
    setDuplicating(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Contract duplicat.", "success");
    if (result?.data?.contractId) {
      router.push(`/dashboard/contracts/${result.data.contractId}?edit=1`);
    }
  }

  async function handleCancel() {
    if (!requireLive("Anularea contractelor necesită un cont conectat.")) {
      setCancelOpen(false);
      return;
    }
    setCancelling(true);
    const result = await cancelContractAction(contract.id);
    setCancelling(false);
    setCancelOpen(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Contract anulat.", "success");
    router.refresh();
  }

  async function handleNewVersion() {
    if (!requireLive("Versiunea nouă necesită un cont conectat.")) return;
    setVersioning(true);
    const result = await createContractVersionAction(contract.id);
    setVersioning(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Versiune nouă creată.", "success");
    if (result?.data?.contractId) {
      router.push(`/dashboard/contracts/${result.data.contractId}?edit=1`);
    }
  }

  async function handleCreateProject() {
    if (!requireLive("Crearea proiectelor necesită un cont conectat.")) return;
    setCreatingProject(true);
    const result = await createProjectFromContractAction(contract.id);
    setCreatingProject(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Proiect creat.", "success");
    if (result?.data?.projectId) {
      router.push(`/dashboard/projects/${result.data.projectId}`);
    }
  }

  async function handlePortal() {
    if (!contract.clientId) {
      toast("Contractul nu are client asociat.", "error");
      return;
    }
    if (!requireLive("Portalul client necesită un cont conectat.")) return;
    setPortalBusy(true);
    const result = await createPortalTokenAction(contract.clientId);
    setPortalBusy(false);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    if (result?.data?.portalUrlPath) {
      const url = `${window.location.origin}${result.data.portalUrlPath}`;
      try {
        await navigator.clipboard.writeText(url);
        toast("Link portal copiat în clipboard.", "success");
      } catch {
        toast("Link portal generat.", "success");
      }
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/contracts"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
        Înapoi la contracte
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-medium text-foreground">{contract.title}</h1>
            <StatusBadge
              label={CONTRACT_STATUS_LABELS[contract.effectiveStatus]}
              tone={CONTRACT_STATUS_TONE[contract.effectiveStatus]}
            />
            {contract.version > 1 ? (
              <span className="text-xs text-muted-soft">v{contract.version}</span>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {contract.contractNumber ?? "Fără număr"} · {contract.clientName ?? "Fără client"}
          </p>
          <ContractStatusStepper effectiveStatus={contract.effectiveStatus} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {canEdit ? (
            <Button
              type="button"
              size="sm"
              render={<Link href={`/dashboard/contracts/${contract.id}/edit`} />}
              nativeButton={false}
            >
              <Pencil data-icon="inline-start" />
              Editează draft
            </Button>
          ) : null}
          {canPublish ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setPublishOpen(true)}>
              <Send data-icon="inline-start" />
              Publică
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
          {canVersion ? (
            <Button type="button" variant="outline" size="sm" onClick={handleNewVersion} disabled={versioning}>
              <Plus data-icon="inline-start" />
              {versioning ? "Se creează…" : "Versiune nouă"}
            </Button>
          ) : null}
          {canCancel ? (
            <Button type="button" variant="outline" size="sm" onClick={() => setCancelOpen(true)}>
              <Ban data-icon="inline-start" />
              Anulează
            </Button>
          ) : null}
          {contract.effectiveStatus === "accepted" && canWrite ? (
            <Button
              type="button"
              size="sm"
              onClick={handleCreateProject}
              disabled={creatingProject}
            >
              <FolderKanban data-icon="inline-start" />
              {creatingProject ? "Se creează…" : "Creează proiect"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="sm"
            render={
              <a href={`/api/contracts/${contract.id}/pdf`} target="_blank" rel="noopener noreferrer" />
            } nativeButton={false}
          >
            <Download data-icon="inline-start" />
            PDF
          </Button>
          {contract.clientId ? (
            <Button type="button" variant="outline" size="sm" onClick={handlePortal} disabled={portalBusy}>
              <Globe data-icon="inline-start" />
              {portalBusy ? "Se generează…" : "Portal client"}
            </Button>
          ) : null}
        </div>
      </div>

      {hasPublicLink && copiedPublicPath ? (
        <div className="surface-card flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Link public contract</p>
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

      <div className="grid gap-4 lg:grid-cols-4">
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Total</p>
          <p className="font-heading text-xl font-medium text-champagne">
            {formatCurrency(contract.total, contract.currency)}
          </p>
        </div>
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Avans</p>
          <p className="font-heading text-xl font-medium text-foreground">
            {formatCurrency(contract.depositAmount, contract.currency)}
          </p>
        </div>
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Rest</p>
          <p className="font-heading text-xl font-medium text-foreground">
            {formatCurrency(contract.remainingAmount, contract.currency)}
          </p>
        </div>
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Eveniment</p>
          <p className="font-heading text-xl font-medium text-foreground">
            {contract.eventDate ? formatDate(contract.eventDate) : "—"}
          </p>
          {contract.eventLocation ? (
            <p className="text-xs text-muted-soft">{contract.eventLocation}</p>
          ) : null}
        </div>
      </div>

      {contract.proposalId ? (
        <div className="surface-card p-5">
          <p className="text-sm text-muted-foreground">Generat din ofertă acceptată.</p>
          <Link
            href={`/dashboard/proposals/${contract.proposalId}`}
            className="mt-2 inline-flex text-sm text-champagne hover:text-champagne-soft"
          >
            Vezi oferta {contract.proposalNumber ? `· ${contract.proposalNumber}` : ""}
          </Link>
        </div>
      ) : null}

      {canEdit ? (
        <div id="contract-editor" className="space-y-3 scroll-mt-24">
          <div className="surface-card p-4">
            <p className="text-sm text-muted-foreground">
              Contractul este în draft. Poți modifica liber clauzele și conținutul, apoi salvează.
            </p>
          </div>
          <ContractEditor
            contractId={contract.id}
            initial={editorInitial}
            canWrite={canWrite}
            onSaved={() => router.refresh()}
          />
        </div>
      ) : (
        <ContractReadOnlyPreview contract={contract} />
      )}

      <Dialog open={publishOpen} onOpenChange={(next) => !publishing && setPublishOpen(next)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Publici acest contract?</DialogTitle>
            <DialogDescription>
              Clientul va primi un link public pentru vizualizare și acceptare digitală. După
              publicare, conținutul nu mai poate fi editat liber.
            </DialogDescription>
          </DialogHeader>
          {unresolvedCritical.length > 0 ? (
            <div
              className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning"
              role="alert"
            >
              Placeholder-uri critice nerezolvate:{" "}
              {unresolvedCritical.map((v) => `{{${v}}}`).join(", ")}. Publicarea poate eșua până le
              completezi.
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPublishOpen(false)} disabled={publishing}>
              Renunță
            </Button>
            <Button type="button" onClick={handlePublish} disabled={publishing}>
              {publishing ? "Se publică…" : "Publică contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={cancelOpen} onOpenChange={(next) => !cancelling && setCancelOpen(next)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Anulezi acest contract?</DialogTitle>
            <DialogDescription>
              Contractul va fi marcat drept anulat și nu va mai putea fi acceptat de client.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelOpen(false)} disabled={cancelling}>
              Renunță
            </Button>
            <Button type="button" variant="destructive" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Se anulează…" : "Anulează contract"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ContractReadOnlyPreview({ contract }: { contract: ContractDetailData }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 lg:grid-cols-2">
        <PartyPreview title="Furnizor" party={contract.content.provider} />
        <PartyPreview title="Client" party={contract.content.client} />
      </div>

      <div className="surface-card space-y-4 p-5">
        <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">Servicii</p>
        <div className="divide-y divide-border">
          {contract.content.services.map((item, index) => (
            <div key={`${item.name}-${index}`} className="flex flex-wrap items-start justify-between gap-3 py-3">
              <div>
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-soft">
                  {item.quantity} × {formatCurrency(item.unitPrice, contract.currency)}
                </p>
              </div>
              <p className="text-sm font-medium text-foreground">
                {formatCurrency(item.lineTotal, contract.currency)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {(Object.keys(SECTION_LABELS) as Array<keyof ContractSections>).map((key) => {
        const body = contract.content.sections[key];
        if (!body?.trim()) return null;
        return (
          <div key={key} className="surface-card space-y-2 p-5">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {SECTION_LABELS[key]}
            </p>
            <p className="text-sm whitespace-pre-wrap text-foreground">{body}</p>
          </div>
        );
      })}

      {(contract.content.customSections ?? []).map((section) => (
        <div key={section.id} className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            {section.title}
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{section.content}</p>
        </div>
      ))}

      {contract.terms ? (
        <div className="surface-card space-y-2 p-5">
          <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
            Termeni generali
          </p>
          <p className="text-sm whitespace-pre-wrap text-foreground">{contract.terms}</p>
        </div>
      ) : null}

      <div className="surface-card grid gap-3 p-5 text-sm sm:grid-cols-2">
        <div>
          <p className="text-xs text-muted-soft">Creat</p>
          <p className="text-foreground">{formatDateTime(contract.createdAt)}</p>
        </div>
        {contract.publishedAt ? (
          <div>
            <p className="text-xs text-muted-soft">Publicat</p>
            <p className="text-foreground">{formatDateTime(contract.publishedAt)}</p>
          </div>
        ) : null}
        {contract.viewedAt ? (
          <div>
            <p className="text-xs text-muted-soft">Vizualizat</p>
            <p className="text-foreground">{formatDateTime(contract.viewedAt)}</p>
          </div>
        ) : null}
        {contract.acceptedAt ? (
          <div>
            <p className="text-xs text-muted-soft">Acceptat</p>
            <p className="text-foreground">{formatDateTime(contract.acceptedAt)}</p>
          </div>
        ) : null}
        {contract.validUntil ? (
          <div>
            <p className="text-xs text-muted-soft">Valabil până la</p>
            <p className="text-foreground">{formatDate(contract.validUntil)}</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function PartyPreview({
  title,
  party,
}: {
  title: string;
  party: ContractDetailData["content"]["provider"];
}) {
  return (
    <div className="surface-card space-y-2 p-5">
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{title}</p>
      <p className="text-sm font-medium text-foreground">{party.name}</p>
      {party.email ? <p className="text-xs text-muted-foreground">{party.email}</p> : null}
      {party.phone ? <p className="text-xs text-muted-foreground">{party.phone}</p> : null}
      {party.address ? <p className="text-xs text-muted-soft">{party.address}</p> : null}
    </div>
  );
}
