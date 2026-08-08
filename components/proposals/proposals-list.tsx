"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ExternalLink, FileText, Plus, Search } from "lucide-react";

import { DemoBanner } from "@/components/shared/demo-banner";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PROPOSAL_STATUSES, type ProposalStatus } from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";

export type ProposalListItem = {
  id: string;
  proposalNumber: string | null;
  title: string;
  clientName: string | null;
  leadName: string | null;
  total: number;
  currency: string;
  status: string;
  effectiveStatus: ProposalStatus;
  validUntil: string | null;
  publicToken: string | null;
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

type ProposalsListProps = {
  initialProposals: ProposalListItem[];
  mode: "live" | "demo";
  canWrite: boolean;
  error?: string | null;
};

export function ProposalsList({ initialProposals, mode, canWrite, error }: ProposalsListProps) {
  const { t } = useI18n();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<ProposalStatus | "all">("all");
  const canCreate = mode === "demo" || canWrite;

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return initialProposals.filter((proposal) => {
      if (status !== "all" && proposal.effectiveStatus !== status) return false;
      if (!query) return true;
      const haystack = `${proposal.title} ${proposal.proposalNumber ?? ""} ${proposal.clientName ?? ""} ${proposal.leadName ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [initialProposals, search, status]);

  return (
    <ModuleShell
      title={t("modules.proposals.title")}
      description={t("modules.proposals.description")}
      actions={
        canCreate ? (
          <Button type="button" render={<Link href="/dashboard/proposals/new" />} nativeButton={false}>
            <Plus data-icon="inline-start" />
            {t("modules.proposals.new")}
          </Button>
        ) : undefined
      }
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

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block max-w-sm flex-1">
            <span className="sr-only">{t("modules.proposals.searchSr")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("modules.proposals.searchPlaceholder")}
              className="h-9 pl-9"
            />
          </label>

          <Select value={status} onValueChange={(value) => setStatus((value as ProposalStatus | "all") ?? "all")}>
            <SelectTrigger className="h-9 w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
              {PROPOSAL_STATUSES.map((item) => (
                <SelectItem key={item} value={item}>
                  {t(`status.proposal.${item}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={initialProposals.length === 0 ? t("modules.proposals.empty") : t("modules.proposals.emptyFiltered")}
            description={
              initialProposals.length === 0
                ? t("modules.proposals.emptyHint")
                : t("common.searchNoResultsHint")
            }
            action={
              initialProposals.length === 0 && canCreate ? (
                <Button type="button" render={<Link href="/dashboard/proposals/new" />} nativeButton={false}>
                  <Plus data-icon="inline-start" />
                  {t("modules.proposals.new")}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="surface-card overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-[0.08em]">
                  <th className="px-4 py-3 font-medium">{t("common.number")}</th>
                  <th className="px-4 py-3 font-medium">{t("modules.proposals.clientOrLead")}</th>
                  <th className="px-4 py-3 font-medium">{t("common.title")}</th>
                  <th className="px-4 py-3 font-medium">{t("common.amount")}</th>
                  <th className="px-4 py-3 font-medium">{t("common.status")}</th>
                  <th className="px-4 py-3 font-medium">{t("modules.proposals.validUntil")}</th>
                  <th className="px-4 py-3 font-medium">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((proposal) => (
                  <tr key={proposal.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-muted-foreground">{proposal.proposalNumber ?? "—"}</td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {proposal.clientName ?? proposal.leadName ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{proposal.title}</td>
                    <td className="px-4 py-3 text-champagne">
                      {formatCurrency(proposal.total, proposal.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={t(`status.proposal.${proposal.effectiveStatus}`)}
                        tone={PROPOSAL_STATUS_TONE[proposal.effectiveStatus]}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {proposal.validUntil ? formatDate(proposal.validUntil) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`/dashboard/proposals/${proposal.id}`}
                          className="text-xs text-champagne hover:text-champagne-soft"
                        >
                          {t("common.view")}
                        </Link>
                        {proposal.publicToken && proposal.status !== "draft" ? (
                          <Link
                            href={`/p/${proposal.publicToken}`}
                            target="_blank"
                            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            {t("modules.proposals.publicLink")}
                            <ExternalLink className="h-3 w-3" aria-hidden />
                          </Link>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </ModuleShell>
  );
}
