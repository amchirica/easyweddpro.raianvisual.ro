"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Kanban,
  List,
  Mail,
  MapPin,
  Phone,
  Search,
  Table2,
  Tag,
  Users,
} from "lucide-react";

import { useI18n } from "@/components/providers/i18n-provider";
import { useToast } from "@/components/shared/toast-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { updateLeadStatusAction } from "@/lib/actions/leads";
import { LEAD_STATUSES, type LeadStatus } from "@/lib/constants";
import type { LeadViewModel } from "@/lib/crm/mappers";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type BoardView = "table" | "kanban" | "list";

type StatusFilter = LeadStatus | "all";
type SourceFilter = string | "all";

type LeadsBoardProps = {
  initialLeads: LeadViewModel[];
  mode: "live" | "demo";
  currency?: string;
  error?: string | null;
};

const LEAD_STATUS_TONE: Record<LeadStatus, "neutral" | "accent" | "success" | "warning" | "danger"> = {
  new: "accent",
  contacted: "neutral",
  qualified: "accent",
  proposal_sent: "warning",
  negotiation: "warning",
  won: "success",
  lost: "danger",
};

const VIEW_OPTIONS: { value: BoardView; labelKey: string; icon: typeof Table2 }[] = [
  { value: "table", labelKey: "common.table", icon: Table2 },
  { value: "kanban", labelKey: "common.kanban", icon: Kanban },
  { value: "list", labelKey: "common.list", icon: List },
];

function matchesSearch(lead: LeadViewModel, query: string) {
  if (!query) return true;
  const haystack = `${lead.name} ${lead.email} ${lead.city} ${lead.venue} ${lead.eventType}`.toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function LeadsBoard({ initialLeads, mode, currency = "RON", error }: LeadsBoardProps) {
  const { t } = useI18n();
  const [leads, setLeads] = useState<LeadViewModel[]>(initialLeads);
  const [view, setView] = useState<BoardView>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const { toast } = useToast();

  const sources = useMemo(() => {
    const set = new Set<string>();
    for (const lead of leads) {
      if (lead.source.trim()) set.add(lead.source.trim());
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [leads]);

  const filteredLeads = useMemo(() => {
    return leads.filter(
      (lead) =>
        matchesSearch(lead, search) &&
        (statusFilter === "all" || lead.status === statusFilter) &&
        (sourceFilter === "all" || lead.source === sourceFilter),
    );
  }, [leads, search, statusFilter, sourceFilter]);

  async function updateLeadStatus(id: string, status: LeadStatus) {
    const previous = leads;
    setLeads((current) => current.map((lead) => (lead.id === id ? { ...lead, status } : lead)));

    if (mode !== "live") return;

    const result = await updateLeadStatusAction(id, { status });
    if (result?.error) {
      setLeads(previous);
      toast(result.error, "error");
      return;
    }
    toast(result?.success ?? "Status actualizat.", "success");
  }

  return (
    <div className="space-y-5">
      {error ? (
        <p
          className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          role="alert"
        >
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block flex-1 sm:max-w-xs">
            <span className="sr-only">{t("modules.leads.searchSr")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("modules.leads.searchPlaceholder")}
              className="h-9 pl-9"
            />
          </label>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter((value as StatusFilter) ?? "all")}
          >
            <SelectTrigger className="h-9 w-full sm:w-48">
              <SelectValue placeholder={t("common.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("common.allStatuses")}</SelectItem>
              {LEAD_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`status.lead.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={sourceFilter}
            onValueChange={(value) => setSourceFilter((value as SourceFilter) ?? "all")}
          >
            <SelectTrigger className="h-9 w-full sm:w-44">
              <SelectValue placeholder="Toate sursele" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate sursele</SelectItem>
              {sources.map((source) => (
                <SelectItem key={source} value={source}>
                  {source}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-border bg-background/40 p-1">
          {VIEW_OPTIONS.map((option) => {
            const Icon = option.icon;
            const active = view === option.value;
            return (
              <Button
                key={option.value}
                type="button"
                variant={active ? "secondary" : "ghost"}
                size="sm"
                className={cn(!active && "text-muted-foreground")}
                onClick={() => setView(option.value)}
                aria-pressed={active}
              >
                <Icon data-icon="inline-start" />
                {t(option.labelKey)}
              </Button>
            );
          })}
        </div>
      </div>

      <p className="text-sm text-muted-foreground">
        {filteredLeads.length} {filteredLeads.length === 1 ? "lead" : "leaduri"} din {leads.length}{" "}
        total
      </p>

      {filteredLeads.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t("modules.leads.emptyFiltered")}
          description={t("modules.leads.emptyFilteredHint")}
        />
      ) : view === "table" ? (
        <LeadsTable leads={filteredLeads} onStatusChange={updateLeadStatus} currency={currency} />
      ) : view === "kanban" ? (
        <LeadsKanban leads={filteredLeads} onStatusChange={updateLeadStatus} currency={currency} />
      ) : (
        <LeadsList leads={filteredLeads} onStatusChange={updateLeadStatus} currency={currency} />
      )}
    </div>
  );
}

type LeadsViewProps = {
  leads: LeadViewModel[];
  onStatusChange: (id: string, status: LeadStatus) => void;
  currency: string;
};

function LeadStatusSelect({
  lead,
  onStatusChange,
  className,
}: {
  lead: LeadViewModel;
  onStatusChange: (id: string, status: LeadStatus) => void;
  className?: string;
}) {
  const { t } = useI18n();
  return (
    <Select
      value={lead.status}
      onValueChange={(value) => onStatusChange(lead.id, value as LeadStatus)}
    >
      <SelectTrigger size="sm" className={cn("h-7 text-xs", className)}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {LEAD_STATUSES.map((status) => (
          <SelectItem key={status} value={status}>
            {t(`status.lead.${status}`)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function LeadNameLink({ lead }: { lead: LeadViewModel }) {
  return (
    <Link
      href={`/dashboard/leads/${lead.id}`}
      className="font-medium text-foreground hover:text-champagne hover:underline"
    >
      {lead.name}
    </Link>
  );
}

function LeadsTable({ leads, onStatusChange, currency }: LeadsViewProps) {
  const { t } = useI18n();
  return (
    <div className="surface-card overflow-x-auto">
      <table className="w-full min-w-[880px] text-left text-sm">
        <thead>
          <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-[0.08em]">
            <th className="px-4 py-3 font-medium">Client</th>
            <th className="px-4 py-3 font-medium">Eveniment</th>
            <th className="px-4 py-3 font-medium">{t("common.city")}</th>
            <th className="px-4 py-3 font-medium">{t("common.source")}</th>
            <th className="px-4 py-3 font-medium">{t("common.estimatedValue")}</th>
            <th className="px-4 py-3 font-medium">Follow-up</th>
            <th className="px-4 py-3 font-medium">Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {leads.map((lead) => (
            <tr key={lead.id} className="transition-colors hover:bg-white/[0.02]">
              <td className="px-4 py-3">
                <p>
                  <LeadNameLink lead={lead} />
                </p>
                <p className="text-xs text-muted-foreground">{lead.email || "—"}</p>
              </td>
              <td className="px-4 py-3">
                <p className="text-foreground">{lead.eventType || "—"}</p>
                <p className="text-xs text-muted-foreground">
                  {lead.eventDate ? formatDate(lead.eventDate) : "—"}
                </p>
              </td>
              <td className="px-4 py-3 text-muted-foreground">{lead.city || "—"}</td>
              <td className="px-4 py-3 text-muted-foreground">{lead.source || "—"}</td>
              <td className="px-4 py-3 text-foreground">
                {formatCurrency(lead.estimatedValue, lead.currency || currency)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {lead.followUpDate ? formatDate(lead.followUpDate) : "—"}
              </td>
              <td className="px-4 py-3">
                <LeadStatusSelect lead={lead} onStatusChange={onStatusChange} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LeadsKanban({ leads, onStatusChange, currency }: LeadsViewProps) {
  const { t } = useI18n();
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {LEAD_STATUSES.map((status) => {
        const columnLeads = leads.filter((lead) => lead.status === status);
        const columnValue = columnLeads.reduce((sum, lead) => sum + lead.estimatedValue, 0);

        return (
          <div key={status} className="w-72 shrink-0 space-y-3">
            <div className="flex items-center justify-between rounded-xl border border-border bg-background/40 px-3 py-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t(`status.lead.${status}`)}
                </p>
                <p className="text-xs text-muted-soft">{formatCurrency(columnValue, currency)}</p>
              </div>
              <StatusBadge label={String(columnLeads.length)} tone={LEAD_STATUS_TONE[status]} />
            </div>

            <div className="space-y-3">
              {columnLeads.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-xs text-muted-soft">
                  {t("modules.leads.emptyColumn")}
                </div>
              ) : (
                columnLeads.map((lead) => (
                  <div key={lead.id} className="surface-card space-y-2 p-3">
                    <p>
                      <LeadNameLink lead={lead} />
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {lead.eventType || "—"} · {lead.eventDate ? formatDate(lead.eventDate) : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <MapPin className="mr-1 inline h-3 w-3" aria-hidden />
                      {lead.city || "—"}
                    </p>
                    <p className="text-sm text-champagne">
                      {formatCurrency(lead.estimatedValue, lead.currency || currency)}
                    </p>
                    {lead.tags.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {lead.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground"
                          >
                            <Tag className="h-2.5 w-2.5" aria-hidden />
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : null}
                    <LeadStatusSelect
                      lead={lead}
                      onStatusChange={onStatusChange}
                      className="w-full"
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function LeadsList({ leads, onStatusChange, currency }: LeadsViewProps) {
  return (
    <div className="surface-card divide-y divide-border">
      {leads.map((lead) => (
        <div
          key={lead.id}
          className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-champagne/10 text-xs font-medium text-champagne">
              {lead.name
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm">
                <LeadNameLink lead={lead} />
              </p>
              <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3 w-3" aria-hidden />
                  {lead.email || "—"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3 w-3" aria-hidden />
                  {lead.phone || "—"}
                </span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:justify-end">
            <span className="text-sm text-champagne">
              {formatCurrency(lead.estimatedValue, lead.currency || currency)}
            </span>
            <LeadStatusSelect lead={lead} onStatusChange={onStatusChange} />
          </div>
        </div>
      ))}
    </div>
  );
}
