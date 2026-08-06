"use client";

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
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUSES,
  PAYMENT_STATUS_LABELS,
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
      toast(result.error ?? "Nu am putut marca plata ca încasată.", "error");
      return;
    }

    setPayments((current) =>
      current.map((item) =>
        item.id === payment.id
          ? { ...item, status: "paid", paidAmount: result.data!.payment.paid_amount }
          : item,
      ),
    );
    toast(result.success ?? "Plată încasată.", "success");
  }

  async function handleDelete(payment: PaymentListItem) {
    if (pendingId) return;
    if (!window.confirm(`Ștergi plata „${payment.label}”?`)) return;
    setPendingId(payment.id);
    const result = await softDeletePaymentAction(payment.id);
    setPendingId(null);

    if (result.error) {
      toast(result.error, "error");
      return;
    }

    setPayments((current) => current.filter((item) => item.id !== payment.id));
    toast(result.success ?? "Plată ștearsă.", "success");
  }

  return (
    <ModuleShell
      title="Plăți"
      description="Avansuri, tranșe și plăți restante pentru toți clienții."
      actions={
        canWrite ? (
          <Button type="button" onClick={() => setDialogOpen(true)}>
            <Plus data-icon="inline-start" />
            Plată nouă
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
            label="Total încasat"
            value={formatCurrency(totalPaid, kpiCurrency)}
            icon={Wallet}
            hint={kpis.length > 1 ? `+${kpis.length - 1} alte valute` : undefined}
          />
          <StatCard
            label="Total de încasat"
            value={formatCurrency(totalOutstanding, kpiCurrency)}
            hint="Sume rămase de colectat"
            icon={CheckCircle2}
          />
          <StatCard
            label="Restante"
            value={formatCurrency(totalOverdue, kpiCurrency)}
            hint={`${overdueCount} plăți întârziate`}
            icon={AlertTriangle}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="relative block max-w-sm flex-1">
            <span className="sr-only">Căutare plăți</span>
            <Search className="pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Caută după denumire, referință, client…"
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
                  {PAYMENT_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title={payments.length === 0 ? "Nicio plată" : "Nicio plată găsită"}
            description={
              payments.length === 0
                ? "Nu există plăți înregistrate."
                : "Încearcă alți termeni de căutare sau alt filtru de status."
            }
            action={
              payments.length === 0 && canWrite ? (
                <Button type="button" onClick={() => setDialogOpen(true)}>
                  <Plus data-icon="inline-start" />
                  Plată nouă
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
                  <th className="px-4 py-3 font-medium">Sumă</th>
                  <th className="px-4 py-3 font-medium">Încasat</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Scadență</th>
                  <th className="px-4 py-3 font-medium">Metodă</th>
                  <th className="px-4 py-3 font-medium">Acțiuni</th>
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
                        label={PAYMENT_STATUS_LABELS[payment.status]}
                        tone={STATUS_TONE[payment.status]}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {payment.dueDate ? formatDate(payment.dueDate) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {payment.method ? PAYMENT_METHOD_LABELS[payment.method] : "—"}
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
                            Încasează
                          </button>
                        ) : null}
                        {canDelete ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(payment)}
                            disabled={pendingId === payment.id}
                            className="text-muted-foreground hover:text-destructive"
                            aria-label={`Șterge plata ${payment.label}`}
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
