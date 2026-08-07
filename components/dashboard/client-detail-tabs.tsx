"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity as ActivityIcon,
  CalendarDays,
  Contact,
  FileText,
  FolderKanban,
  Mail,
  MapPin,
  Phone,
  ScrollText,
  StickyNote,
  Wallet,
} from "lucide-react";

import { useI18n } from "@/components/providers/i18n-provider";
import { EmptyState } from "@/components/shared/empty-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { updateClientAction } from "@/lib/actions/clients";
import type { ActivityViewModel, ClientViewModel } from "@/lib/crm/mappers";
import type { DemoContract, DemoPayment, DemoProject } from "@/lib/demo/fixtures";
import { formatCurrency, formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

type SectionId = "contact" | "projects" | "contracts" | "payments" | "notes" | "activity";

type ClientDetailTabsProps = {
  client: ClientViewModel;
  projects: DemoProject[];
  contracts: DemoContract[];
  payments: DemoPayment[];
  activity: ActivityViewModel[];
  mode: "live" | "demo";
};

const SECTIONS: { id: SectionId; labelKey: string; icon: typeof Contact }[] = [
  { id: "contact", labelKey: "modules.clients.tabContact", icon: Contact },
  { id: "projects", labelKey: "modules.projects.title", icon: FolderKanban },
  { id: "contracts", labelKey: "modules.contracts.title", icon: ScrollText },
  { id: "payments", labelKey: "modules.payments.title", icon: Wallet },
  { id: "notes", labelKey: "modules.clients.tabNotes", icon: StickyNote },
  { id: "activity", labelKey: "dashboard.recentActivity", icon: ActivityIcon },
];

const CONTRACT_STATUS_TONE: Record<
  DemoContract["status"],
  "neutral" | "accent" | "success" | "danger" | "warning"
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
  DemoPayment["status"],
  "neutral" | "warning" | "success" | "danger"
> = {
  pending: "neutral",
  partial: "warning",
  paid: "success",
  overdue: "danger",
  cancelled: "neutral",
  refunded: "neutral",
};

export function ClientDetailTabs({
  client,
  projects,
  contracts,
  payments,
  activity,
  mode,
}: ClientDetailTabsProps) {
  const { t } = useI18n();
  const [active, setActive] = useState<SectionId>("contact");
  const [notes, setNotes] = useState(client.notes);
  const [savingNotes, setSavingNotes] = useState(false);
  const { toast } = useToast();

  async function handleSaveNotes() {
    if (savingNotes) return;
    setSavingNotes(true);

    if (mode === "live") {
      const result = await updateClientAction(client.id, {
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        address: client.address,
        city: client.city,
        country: client.country,
        eventType: client.eventType,
        eventDate: client.eventDate,
        notes,
        tags: client.tags,
        source: client.source,
        status: client.status,
      });

      if (result?.error) {
        toast(result.error, "error");
        setSavingNotes(false);
        return;
      }
      toast(result?.success ?? t("modules.clients.notesSaved"), "success");
    } else {
      toast(t("modules.clients.notesSavedDemo"), "success");
    }

    setSavingNotes(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-background/40 p-1">
        {SECTIONS.map((section) => {
          const Icon = section.icon;
          const isActive = active === section.id;
          return (
            <button
              key={section.id}
              type="button"
              onClick={() => setActive(section.id)}
              className={cn(
                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm whitespace-nowrap transition-colors",
                isActive
                  ? "bg-champagne/10 text-champagne"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
              )}
              aria-pressed={isActive}
            >
              <Icon className="h-4 w-4" aria-hidden />
              {t(section.labelKey)}
            </button>
          );
        })}
      </div>

      {active === "contact" ? (
        <div className="surface-card grid grid-cols-1 gap-6 p-5 sm:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
                {t("modules.clients.contactDetails")}
              </p>
              <StatusBadge
                label={t(`status.client.${client.status}`)}
                tone="accent"
              />
            </div>
            <p className="flex items-center gap-2 text-sm text-foreground">
              <Mail className="h-4 w-4 text-champagne" aria-hidden />
              {client.email || "—"}
            </p>
            <p className="flex items-center gap-2 text-sm text-foreground">
              <Phone className="h-4 w-4 text-champagne" aria-hidden />
              {client.phone || "—"}
            </p>
            <p className="flex items-center gap-2 text-sm text-foreground">
              <MapPin className="h-4 w-4 text-champagne" aria-hidden />
              {client.city || "—"}
            </p>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
              {t("modules.clients.event")}
            </p>
            <p className="flex items-center gap-2 text-sm text-foreground">
              <CalendarDays className="h-4 w-4 text-champagne" aria-hidden />
              {client.eventType || "—"} · {client.eventDate ? formatDate(client.eventDate) : "—"}
            </p>
            <p className="text-sm text-muted-foreground">{t("common.totalValue")}</p>
            <p className="font-heading text-2xl font-medium text-champagne">
              {formatCurrency(client.totalValue)}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              render={<Link href={`/dashboard/proposals/new?clientId=${client.id}`} />} nativeButton={false}
            >
              <FileText data-icon="inline-start" />
              {t("modules.proposals.new")}
            </Button>
          </div>
        </div>
      ) : null}

      {active === "projects" ? (
        projects.length === 0 ? (
          <EmptyState
            icon={FolderKanban}
            title={t("modules.projects.empty")}
            description={t("modules.clients.noProjects")}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <div key={project.id} className="surface-card space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-foreground">{project.name}</p>
                  <StatusBadge label={t(`status.project.${project.status}`)} tone="accent" />
                </div>
                <p className="text-xs text-muted-foreground">
                  {t("modules.clients.deliveryDeadline")}: {formatDate(project.deadline)}
                </p>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full bg-champagne"
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
                <p className="text-xs text-muted-soft">
                  {t("common.completedPercent", { percent: project.progress })}
                </p>
              </div>
            ))}
          </div>
        )
      ) : null}

      {active === "contracts" ? (
        contracts.length === 0 ? (
          <EmptyState
            icon={ScrollText}
            title={t("modules.contracts.empty")}
            description={t("modules.clients.noContracts")}
          />
        ) : (
          <div className="surface-card divide-y divide-border">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{contract.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {contract.signedAt
                      ? `${t("common.signed")} ${formatDate(contract.signedAt)}`
                      : t("common.unsigned")}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-champagne">{formatCurrency(contract.amount)}</span>
                  <StatusBadge
                    label={t(`status.contract.${contract.status}`)}
                    tone={CONTRACT_STATUS_TONE[contract.status]}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}

      {active === "payments" ? (
        payments.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={t("modules.payments.empty")}
            description={t("modules.clients.noPayments")}
          />
        ) : (
          <div className="surface-card divide-y divide-border">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className={cn(
                  "flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                  payment.status === "overdue" && "bg-destructive/5",
                )}
              >
                <div>
                  <p className="text-sm font-medium text-foreground">{payment.label}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("common.dueDate")} {formatDate(payment.dueDate)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-foreground">
                    {formatCurrency(payment.paidAmount)} / {formatCurrency(payment.amount)}
                  </span>
                  <StatusBadge
                    label={t(`status.payment.${payment.status}`)}
                    tone={PAYMENT_STATUS_TONE[payment.status]}
                  />
                </div>
              </div>
            ))}
          </div>
        )
      ) : null}

      {active === "notes" ? (
        <div className="surface-card space-y-3 p-5">
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            {t("modules.clients.internalNotes")}
          </p>
          <Textarea
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            rows={6}
            placeholder={t("modules.clients.notesPlaceholder")}
          />
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs text-muted-soft">
              {t("modules.clients.notesPrivate")}
            </p>
            <Button type="button" size="sm" onClick={handleSaveNotes} disabled={savingNotes}>
              {savingNotes ? t("common.saving") : t("modules.clients.saveNotes")}
            </Button>
          </div>
        </div>
      ) : null}

      {active === "activity" ? (
        activity.length === 0 ? (
          <EmptyState
            icon={ActivityIcon}
            title={t("modules.clients.noActivity")}
            description={t("modules.clients.noActivityHint")}
          />
        ) : (
          <ul className="surface-card divide-y divide-border">
            {activity.map((item) => (
              <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-background/40 text-champagne">
                  <ActivityIcon className="h-3.5 w-3.5" aria-hidden />
                </div>
                <div className="min-w-0">
                  <p className="text-sm text-foreground">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.description}</p>
                  <p className="mt-0.5 text-xs text-muted-soft">{formatDate(item.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        )
      ) : null}
    </div>
  );
}
