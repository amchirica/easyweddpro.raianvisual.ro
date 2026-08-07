"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  Archive,
  Ban,
  Copy,
  Download,
  ExternalLink,
  Files,
  Globe,
  MoreHorizontal,
  Pencil,
  Plus,
  ScrollText,
  Search,
  Send,
  Trash2,
} from "lucide-react";

import { DemoBanner } from "@/components/shared/demo-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  archiveContractAction,
  cancelContractAction,
  createContractAction,
  createContractVersionAction,
  createPortalTokenAction,
  duplicateContractAction,
  publishContractAction,
  softDeleteContractAction,
} from "@/lib/actions/contracts";
import {
  CONTRACT_STATUSES,
  type ContractStatus,
} from "@/lib/constants";
import {
  canCancelContract,
  canCreateNewVersion,
  canEditContract,
  canPublishContract,
} from "@/lib/contracts/status";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export type ContractListItem = {
  id: string;
  contractNumber: string | null;
  title: string;
  clientName: string | null;
  clientId: string | null;
  total: number;
  deposit: number;
  remaining: number;
  currency: string;
  status: string;
  effectiveStatus: ContractStatus;
  eventDate: string | null;
  updatedAt: string;
  publicToken: string | null;
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

type ClientOption = { id: string; name: string };

type ContractsListProps = {
  initialContracts: ContractListItem[];
  mode: "live" | "demo";
  canWrite: boolean;
  clients?: ClientOption[];
  error?: string | null;
};

export function ContractsList({
  initialContracts,
  mode,
  canWrite,
  clients,
  error,
}: ContractsListProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ContractStatus | "all">("all");
  const [clientId, setClientId] = useState<string>("all");
  const [eventFrom, setEventFrom] = useState("");
  const [eventTo, setEventTo] = useState("");
  const [publishTarget, setPublishTarget] = useState<ContractListItem | null>(null);
  const [cancelTarget, setCancelTarget] = useState<ContractListItem | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  function requireLive(message: string): boolean {
    if (mode !== "live") {
      toast(message, "info");
      return false;
    }
    return true;
  }

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return initialContracts.filter((contract) => {
      if (status !== "all" && contract.effectiveStatus !== status) return false;
      if (clientId !== "all" && contract.clientId !== clientId) return false;
      if (eventFrom && contract.eventDate && contract.eventDate < eventFrom) return false;
      if (eventTo && contract.eventDate && contract.eventDate > eventTo) return false;
      if (!query) return true;
      const haystack =
        `${contract.title} ${contract.contractNumber ?? ""} ${contract.clientName ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [initialContracts, search, status, clientId, eventFrom, eventTo]);

  async function handlePublish(contract: ContractListItem) {
    if (!requireLive(t("modules.contracts.needAccountPublish"))) {
      setPublishTarget(null);
      return;
    }
    setBusyId(contract.id);
    const result = await publishContractAction(contract.id);
    setBusyId(null);
    setPublishTarget(null);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Contract publicat.", "success");
    router.refresh();
  }

  async function handleCancel(contract: ContractListItem) {
    if (!requireLive(t("modules.contracts.needAccountCancel"))) {
      setCancelTarget(null);
      return;
    }
    setBusyId(contract.id);
    const result = await cancelContractAction(contract.id);
    setBusyId(null);
    setCancelTarget(null);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Contract anulat.", "success");
    router.refresh();
  }

  async function handleDuplicate(contractId: string) {
    if (!requireLive(t("modules.contracts.needAccountDuplicate"))) return;
    setBusyId(contractId);
    const result = await duplicateContractAction(contractId);
    setBusyId(null);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Contract duplicat.", "success");
    if (result?.data?.contractId) {
      router.push(`/dashboard/contracts/${result.data.contractId}?edit=1`);
    }
  }

  async function handleNewVersion(contractId: string) {
    if (!requireLive(t("modules.contracts.needAccountVersion"))) return;
    setBusyId(contractId);
    const result = await createContractVersionAction(contractId);
    setBusyId(null);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? t("modules.contracts.versionCreated"), "success");
    if (result?.data?.contractId) {
      router.push(`/dashboard/contracts/${result.data.contractId}?edit=1`);
    }
  }

  async function handleCopyLink(contract: ContractListItem) {
    if (!contract.publicToken) return;
    const url = `${window.location.origin}/c/${contract.publicToken}`;
    try {
      await navigator.clipboard.writeText(url);
      toast(t("common.linkCopied"), "success");
    } catch {
      toast("Nu am putut copia linkul.", "error");
    }
  }

  async function handleCreate() {
    if (!requireLive(t("modules.contracts.needAccountCreate"))) return;
    setBusyId("new");
    const result = await createContractAction({ title: "Contract nou" });
    setBusyId(null);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Contract creat.", "success");
    if (result?.data?.contractId) {
      router.push(`/dashboard/contracts/${result.data.contractId}/edit`);
    }
  }

  async function handleSoftDelete(contract: ContractListItem) {
    if (!requireLive(t("modules.contracts.needAccountDelete"))) return;
    if (
      !window.confirm(
        t("modules.contracts.deleteDraftConfirm", { title: contract.title }),
      )
    ) {
      return;
    }
    setBusyId(contract.id);
    const result = await softDeleteContractAction(contract.id);
    setBusyId(null);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? t("modules.contracts.deleted"), "success");
    router.refresh();
  }

  async function handleArchive(contract: ContractListItem) {
    if (!requireLive(t("modules.contracts.needAccountArchive"))) return;
    if (!window.confirm(`Arhivezi contractul „${contract.title}”?`)) return;
    setBusyId(contract.id);
    const result = await archiveContractAction(contract.id);
    setBusyId(null);
    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Contract arhivat.", "success");
    router.refresh();
  }

  async function handlePortal(contract: ContractListItem) {
    if (!contract.clientId) {
      toast("Contractul nu are client asociat.", "error");
      return;
    }
    if (!requireLive(t("modules.contracts.needAccountPortal"))) return;
    setBusyId(contract.id);
    const result = await createPortalTokenAction(contract.clientId);
    setBusyId(null);

    if (result?.error) {
      toast(result.error, "error");
      return;
    }
    if (result?.data?.portalUrlPath) {
      const url = `${window.location.origin}${result.data.portalUrlPath}`;
      try {
        await navigator.clipboard.writeText(url);
        toast(t("modules.contracts.portalLinkCopied"), "success");
      } catch {
        toast(t("modules.contracts.portalLinkCopied"), "success");
      }
    }
  }

  return (
    <ModuleShell
      title={t("modules.contracts.title")}
      description={t("modules.contracts.description")}
    >
      <div className="space-y-5">
        {mode === "demo" ? <DemoBanner /> : null}

        {error ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <label className="relative block max-w-sm flex-1">
              <span className="sr-only">{t("modules.contracts.searchSr")}</span>
              <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={t("modules.contracts.searchPlaceholder")}
                className="h-9 pl-9"
              />
            </label>

            {canWrite ? (
              <Button type="button" size="sm" onClick={handleCreate} disabled={busyId === "new"}>
                <Plus data-icon="inline-start" />
                {busyId === "new" ? t("common.creating") : t("modules.contracts.new")}
              </Button>
            ) : null}

            <Select
              value={status}
              onValueChange={(value) => setStatus((value as ContractStatus | "all") ?? "all")}
            >
              <SelectTrigger className="h-9 w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
                {CONTRACT_STATUSES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {t(`status.contract.${item}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {clients && clients.length > 0 ? (
              <Select value={clientId} onValueChange={(value) => setClientId(value ?? "all")}>
                <SelectTrigger className="h-9 w-full sm:w-52">
                  <SelectValue placeholder={t("common.allClients")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t("common.allClients")}</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              type="date"
              value={eventFrom}
              onChange={(event) => setEventFrom(event.target.value)}
              className="h-9 w-full sm:w-44"
              aria-label="Eveniment de la"
            />
            <Input
              type="date"
              value={eventTo}
              onChange={(event) => setEventTo(event.target.value)}
              className="h-9 w-full sm:w-44"
              aria-label={t("modules.contracts.eventUntil")}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={initialContracts.length === 0 ? t("modules.contracts.empty") : t("modules.contracts.emptyFiltered")}
            description={
              initialContracts.length === 0
                ? t("modules.contracts.emptyHint")
                : t("common.searchNoResultsHint")
            }
            action={
              canWrite && initialContracts.length === 0 ? (
                <Button type="button" onClick={handleCreate} disabled={busyId === "new"}>
                  <Plus data-icon="inline-start" />
                  Contract nou
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="surface-card overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-[0.08em]">
                  <th className="px-4 py-3 font-medium">{t("common.number")}</th>
                  <th className="px-4 py-3 font-medium">Client</th>
                  <th className="px-4 py-3 font-medium">Titlu</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Avans</th>
                  <th className="px-4 py-3 font-medium">Rest</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Eveniment</th>
                  <th className="px-4 py-3 font-medium">Actualizat</th>
                  <th className="px-4 py-3 font-medium">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((contract) => {
                  const isBusy = busyId === contract.id;
                  const showEdit = canWrite && canEditContract(contract.effectiveStatus);
                  const showPublish = canWrite && canPublishContract(contract.effectiveStatus);
                  const showCancel = canWrite && canCancelContract(contract.effectiveStatus);
                  const showVersion = canWrite && canCreateNewVersion(contract.effectiveStatus);
                  const hasPublicLink = Boolean(contract.publicToken && contract.status !== "draft");

                  return (
                    <tr key={contract.id} className="transition-colors hover:bg-white/[0.02]">
                      <td className="px-4 py-3 text-muted-foreground">
                        {contract.contractNumber ?? "—"}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {contract.clientName ?? "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{contract.title}</td>
                      <td className="px-4 py-3 text-champagne">
                        {formatCurrency(contract.total, contract.currency)}
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {formatCurrency(contract.deposit, contract.currency)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatCurrency(contract.remaining, contract.currency)}
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge
                          label={t(`status.contract.${contract.effectiveStatus}`)}
                          tone={CONTRACT_STATUS_TONE[contract.effectiveStatus]}
                        />
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {contract.eventDate ? formatDate(contract.eventDate) : "—"}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(contract.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/dashboard/contracts/${contract.id}`}
                            className="text-xs text-champagne hover:text-champagne-soft"
                          >
                            Vezi
                          </Link>
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              render={
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon-sm"
                                  disabled={isBusy}
                                  aria-label={t("common.moreActions")}
                                />
                              }
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              {showEdit ? (
                                <DropdownMenuItem
                                  onClick={() => {
                                    router.push(`/dashboard/contracts/${contract.id}/edit`);
                                  }}
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                  {t("modules.contracts.editDraft")}
                                </DropdownMenuItem>
                              ) : null}
                              {showPublish ? (
                                <DropdownMenuItem onClick={() => setPublishTarget(contract)}>
                                  <Send className="h-3.5 w-3.5" />
                                  {t("modules.contracts.publish")}
                                </DropdownMenuItem>
                              ) : null}
                              {hasPublicLink ? (
                                <DropdownMenuItem onClick={() => handleCopyLink(contract)}>
                                  <Copy className="h-3.5 w-3.5" />
                                  {t("common.copyLink")}
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem onClick={() => handleDuplicate(contract.id)}>
                                <Files className="h-3.5 w-3.5" />
                                {t("common.duplicate")}
                              </DropdownMenuItem>
                              {showCancel ? (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => setCancelTarget(contract)}
                                  >
                                    <Ban className="h-3.5 w-3.5" />
                                    {t("common.cancel")}
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                              {showVersion ? (
                                <DropdownMenuItem onClick={() => handleNewVersion(contract.id)}>
                                  <Plus className="h-3.5 w-3.5" />
                                  {t("modules.contracts.newVersion")}
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                nativeButton={false}
                                render={
                                  <a
                                    href={`/api/contracts/${contract.id}/pdf`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  />
                                }
                              >
                                <Download className="h-3.5 w-3.5" />
                                PDF
                              </DropdownMenuItem>
                              {contract.clientId ? (
                                <DropdownMenuItem onClick={() => handlePortal(contract)}>
                                  <Globe className="h-3.5 w-3.5" />
                                  {t("modules.contracts.portalLink")}
                                </DropdownMenuItem>
                              ) : null}
                              {hasPublicLink ? (
                                <DropdownMenuItem
                                  nativeButton={false}
                                  render={
                                    <Link href={`/c/${contract.publicToken}`} target="_blank" />
                                  }
                                >
                                  <ExternalLink className="h-3.5 w-3.5" />
                                  {t("modules.contracts.openPublic")}
                                </DropdownMenuItem>
                              ) : null}
                              {canWrite &&
                              (contract.effectiveStatus === "accepted" ||
                                contract.effectiveStatus === "published" ||
                                contract.effectiveStatus === "viewed") ? (
                                <DropdownMenuItem onClick={() => handleArchive(contract)}>
                                  <Archive className="h-3.5 w-3.5" />
                                  {t("common.archive")}
                                </DropdownMenuItem>
                              ) : null}
                              {canWrite &&
                              (contract.effectiveStatus === "draft" ||
                                contract.effectiveStatus === "cancelled") ? (
                                <>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    variant="destructive"
                                    onClick={() => handleSoftDelete(contract)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    {t("common.delete")}
                                  </DropdownMenuItem>
                                </>
                              ) : null}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={Boolean(publishTarget)} onOpenChange={(open) => !open && setPublishTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("modules.contracts.publishTitle")}</DialogTitle>
            <DialogDescription>
              {t("modules.contracts.publishConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPublishTarget(null)}>
              {t("common.dismiss")}
            </Button>
            <Button
              type="button"
              onClick={() => publishTarget && handlePublish(publishTarget)}
              disabled={Boolean(busyId)}
            >
              {busyId ? t("common.publishing") : t("modules.contracts.publishContract")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(cancelTarget)} onOpenChange={(open) => !open && setCancelTarget(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("modules.contracts.cancelTitle")}</DialogTitle>
            <DialogDescription>
              {t("modules.contracts.cancelConfirm")}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCancelTarget(null)}>
              {t("common.dismiss")}
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={() => cancelTarget && handleCancel(cancelTarget)}
              disabled={Boolean(busyId)}
            >
              {busyId ? t("common.cancelling") : t("modules.contracts.cancelContract")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ModuleShell>
  );
}
