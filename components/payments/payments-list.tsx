"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Plus, Search, Trash2, Wallet } from "lucide-react";

import {
  PaymentFormDialog,
  type PaymentFormOption,
} from "@/components/payments/payment-form-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { ModuleShell } from "@/components/shared/module-shell";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { markPaidAction, softDeletePaymentAction } from "@/lib/actions/payments";
import {
  PAYMENT_STATUSES,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/constants";
import { formatCurrency, formatDate } from "@/lib/format";
import type { PaymentCurrencyKpi } from "@/lib/data/payments";

export type PaymentListItem = {
  id: string;
  label: string;
  amount: number;
  paidAmount: number;
  currency: string;
  dueDate: string | null;
  method: PaymentMethod | null;
  status: PaymentStatus;
  clientId: string | null;
  clientName: string | null;
  contractId: string | null;
  contractTitle: string | null;
  projectId: string | null;
  projectName: string | null;
  reference: string;
  notes: string;
  proofUrl: string;
};

const STATUS_TONE: Record<PaymentStatus, "neutral" | "accent" | "warning" | "success" | "danger"> = {
  pending: "neutral",
  partial: "accent",
  paid: "success",
  overdue: "danger",
  cancelled: "neutral",
  refunded: "warning",
};

type PaymentsListProps = {
  initialPayments: PaymentListItem[];
  kpis: PaymentCurrencyKpi[];
  clients: PaymentFormOption[];
  contracts: PaymentFormOption[];
  projects: PaymentFormOption[];
  defaultCurrency: string;
  canWrite: boolean;
  canDelete: boolean;
  error?: string | null;
};

export function PaymentsList({
  initialPayments,
  kpis,
  clients,
  contracts,
  projects,
  defaultCurrency,
  canWrite,
  canDelete,
  error,
}: PaymentsListProps) {
  const { t } = useI18n();
  const [payments, setPayments] = useState<PaymentListItem[]>(initialPayments);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const { toast } = useToast();

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return payments.filter((payment) => {
      if (statusFilter !== "all" && payment.status !== statusFilter) return false;
      if (!query) return true;
      const haystack =
        `${payment.label} ${payment.reference} ${payment.clientName ?? ""} ${payment.contractTitle ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [payments, search, statusFilter]);

  const primaryKpi = kpis[0];
  const totalPaid = primaryKpi?.totalPaid ?? 0;
  const totalOutstanding = primaryKpi?.totalOutstanding ?? 0;
  const totalOverdue = primaryKpi?.totalOverdue ?? 0;
  const overdueCount = primaryKpi?.overdueCount ?? 0;
  const kpiCurrency = primaryKpi?.currency ?? defaultCurrency;

  async function handleMarkPaid(payment: PaymentListItem) {
    if (pendingId) return;
    setPendingId(payment.id);
    const result = await markPaidAction(payment.id);
    setPendingId(null);

    if (result.error || !result.data) {
      toast(result.error ?? t("modules.payments.markPaidFailed"), "error");
      return;
    }

    setPayments((current) =>
      current.map((item) =>
        item.id === payment.id
          ? { ...item, status: "paid", paidAmount: result.data!.payment.paid_amount }
          : item,
      ),
    );
    toast(result.success ?? t("modules.payments.markedPaid"), "success");
  }

  async function handleDelete(payment: PaymentListItem) {
    if (pendingId) return;
    if (!window.confirm(t("modules.payments.deleteConfirm", { label: payment.label }))) return;
    setPendingId(payment.id);
    const result = await softDeletePaymentAction(payment.id);
    setPendingId(null);

    if (result.error) {
      toast(result.error, "error");
      return;
    }

    setPayments((current) => current.filter((item) => item.id !== payment.id));
    toast(result.success ?? t("modules.payments.deleted"), "success");
  }

  return (
    <ModuleShell
      title={t("modules.payments.title")}
      description={t("modules.payments.description")}
      actions={
        canWrite ? (
          <Button type="button" onClick={() => setDialogOpen(true)}>
            <Plus data-icon="inline-start" />
            {t("modules.payments.newPayment")}
          </Button>
        ) : undefined
      }
    >
      <div className="space-y-6">
        {error ? (
          <p
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            label={t("modules.payments.totalCollected")}
            value={formatCurrency(totalPaid, kpiCurrency)}
            icon={Wallet}
            hint={kpis.length > 1 ? `+${kpis.length - 1} alte valute` : undefined}
          />
          <StatCard
            label={t("modules.payments.totalOutstanding")}
            value={formatCurrency(totalOutstanding, kpiCurrency)}
            hint={t("modules.payments.outstandingHint")}
            icon={CheckCircle2}
          />
          <StatCard
            label="Restante"
            value={formatCurrency(totalOverdue, kpiCurrency)}
            hint={t("modules.payments.overdueHint", { count: overdueCount })}
            icon={AlertTriangle}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block max-w-sm flex-1">
            <span className="sr-only">{t("modules.payments.searchSr")}</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={t("modules.payments.searchPlaceholder")}
              className="h-9 pl-9"
            />
          </label>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter((value as PaymentStatus | "all") ?? "all")}
          >
            <SelectTrigger className="h-9 w-full sm:w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate statusurile</SelectItem>
              {PAYMENT_STATUSES.map((status) => (
                <SelectItem key={status} value={status}>
                  {t(`status.payment.${status}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={payments.length === 0 ? t("modules.payments.empty") : t("modules.payments.emptyFiltered")}
            description={
              payments.length === 0
                ? t("modules.payments.emptyHint")
                : t("common.searchNoResultsHint")
            }
            action={
              payments.length === 0 && canWrite ? (
                <Button type="button" onClick={() => setDialogOpen(true)}>
                  <Plus data-icon="inline-start" />
                  {t("modules.payments.newPayment")}
                </Button>
              ) : undefined
            }
          />
        ) : (
          <div className="surface-card overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-muted-foreground uppercase tracking-[0.08em]">
                  <th className="px-4 py-3 font-medium">Denumire</th>
                  <th className="px-4 py-3 font-medium">Client / Contract</th>
                  <th className="px-4 py-3 font-medium">{t("common.amount")}</th>
                  <th className="px-4 py-3 font-medium">{t("common.collected")}</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">{t("common.dueDate")}</th>
                  <th className="px-4 py-3 font-medium">{t("common.method")}</th>
                  <th className="px-4 py-3 font-medium">{t("common.actions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((payment) => (
                  <tr key={payment.id} className="transition-colors hover:bg-white/[0.02]">
                    <td className="px-4 py-3 font-medium text-foreground">
                      <Link
                        href={`/dashboard/payments/${payment.id}`}
                        className="hover:text-champagne-soft"
                      >
                        {payment.label}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {payment.clientName ?? payment.contractTitle ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-champagne">
                      {formatCurrency(payment.amount, payment.currency)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatCurrency(payment.paidAmount, payment.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={t(`status.payment.${payment.status}`)}
                        tone={STATUS_TONE[payment.status]}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {payment.dueDate ? formatDate(payment.dueDate) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {payment.method ? t(`status.paymentMethod.${payment.method}`) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {canWrite &&
                        payment.status !== "paid" &&
                        payment.status !== "cancelled" &&
                        payment.status !== "refunded" ? (
                          <button
                            type="button"
                            onClick={() => handleMarkPaid(payment)}
                            disabled={pendingId === payment.id}
                            className="text-xs text-champagne hover:text-champagne-soft"
                          >
                            {t("modules.payments.markPaid")}
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(payment)}
                            disabled={pendingId === payment.id}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={t("modules.payments.deleteAria", { label: payment.label })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

      <PaymentFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode="create"
        clients={clients}
        contracts={contracts}
        projects={projects}
        defaultCurrency={defaultCurrency}
        onSuccess={() => window.location.reload()}
      />
    </ModuleShell>
  );
}
