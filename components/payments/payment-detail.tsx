"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Ban, CheckCircle2, Pencil, PiggyBank, Trash2 } from "lucide-react";

import {
  PaymentFormDialog,
  type PaymentFormOption,
} from "@/components/payments/payment-form-dialog";
import { StatusBadge } from "@/components/shared/status-badge";
import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cancelPaymentAction,
  markPaidAction,
  markPartialAction,
  softDeletePaymentAction,
} from "@/lib/actions/payments";
import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_STATUS_LABELS,
  type PaymentMethod,
  type PaymentStatus,
} from "@/lib/constants";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";

export type PaymentDetailData = {
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
  contractStatus: string | null;
  projectId: string | null;
  projectName: string | null;
  reference: string;
  notes: string;
  proofUrl: string;
  paidAt: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_TONE: Record<PaymentStatus, "neutral" | "accent" | "warning" | "success" | "danger"> = {
  pending: "neutral",
  partial: "accent",
  paid: "success",
  overdue: "danger",
  cancelled: "neutral",
  refunded: "warning",
};

type PaymentDetailProps = {
  payment: PaymentDetailData;
  clients: PaymentFormOption[];
  contracts: PaymentFormOption[];
  projects: PaymentFormOption[];
  defaultCurrency: string;
  canWrite: boolean;
  canDelete: boolean;
};

export function PaymentDetail({
  payment,
  clients,
  contracts,
  projects,
  defaultCurrency,
  canWrite,
  canDelete,
}: PaymentDetailProps) {
  const { t } = useI18n();
  const [editOpen, setEditOpen] = useState(false);
  const [partialOpen, setPartialOpen] = useState(false);
  const [partialAmount, setPartialAmount] = useState(String(payment.paidAmount));
  const [allowOverpay, setAllowOverpay] = useState(false);
  const [pending, setPending] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const isTerminal = payment.status === "cancelled" || payment.status === "refunded";
  const remaining = Math.max(payment.amount - payment.paidAmount, 0);

  async function handleMarkPaid() {
    if (pending) return;
    setPending(true);
    const result = await markPaidAction(payment.id);
    setPending(false);

    if (result.error) {
      toast(result.error, "error");
      return;
    }

    toast(result.success ?? "Plată încasată.", "success");
    router.refresh();
  }

  async function handleMarkPartial(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    const result = await markPartialAction(payment.id, {
      paidAmount: partialAmount,
      allowOverpay,
    });
    setPending(false);

    if (result.error) {
      toast(result.error, "error");
      return;
    }

    toast(result.success ?? "Plată parțială înregistrată.", "success");
    setPartialOpen(false);
    router.refresh();
  }

  async function handleCancel() {
    if (pending) return;
    if (!window.confirm(`Anulezi plata „${payment.label}”?`)) return;
    setPending(true);
    const result = await cancelPaymentAction(payment.id);
    setPending(false);

    if (result.error) {
      toast(result.error, "error");
      return;
    }

    toast(result.success ?? "Plată anulată.", "success");
    router.refresh();
  }

  async function handleDelete() {
    if (pending) return;
    if (!window.confirm(t("modules.payments.deleteConfirm", { label: payment.label }))) return;
    setPending(true);
    const result = await softDeletePaymentAction(payment.id);
    setPending(false);

    if (result.error) {
      toast(result.error, "error");
      return;
    }

    toast(result.success ?? "Plată ștearsă.", "success");
    router.push("/dashboard/payments");
  }

  return (
    <div className="space-y-6">
      <div className="surface-card space-y-4 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2">
            <StatusBadge label={PAYMENT_STATUS_LABELS[payment.status]} tone={STATUS_TONE[payment.status]} />
            <h2 className="font-heading text-2xl font-medium text-foreground">{payment.label}</h2>
            <p className="text-sm text-muted-foreground">
              {formatCurrency(payment.paidAmount, payment.currency)} din{" "}
              {formatCurrency(payment.amount, payment.currency)}
              {remaining > 0 ? ` · rest ${formatCurrency(remaining, payment.currency)}` : ""}
            </p>
          </div>

          {canWrite && !isTerminal ? (
            <div className="flex flex-wrap items-center gap-2">
              {payment.status !== "paid" ? (
                <>
                  <Button type="button" variant="outline" onClick={() => setPartialOpen(true)}>
                    <PiggyBank data-icon="inline-start" />
                    {t("modules.payments.partial")}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleMarkPaid} disabled={pending}>
                    <CheckCircle2 data-icon="inline-start" />
                    {t("modules.payments.markPaid")}
                  </Button>
                </>
              ) : null}
              <Button type="button" variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil data-icon="inline-start" />
                {t("common.edit")}
              </Button>
              <Button type="button" variant="destructive" onClick={handleCancel} disabled={pending}>
                <Ban data-icon="inline-start" />
                {t("common.cancel")}
              </Button>
            </div>
          ) : null}
          {canDelete ? (
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={pending}>
              <Trash2 data-icon="inline-start" />
              {t("common.delete")}
            </Button>
          ) : null}
        </div>

        <dl className="grid grid-cols-1 gap-4 border-t border-border pt-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">{t("common.dueDate")}</dt>
            <dd className="mt-1 text-foreground">
              {payment.dueDate ? formatDate(payment.dueDate) : t("modules.payments.noDeadline")}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">{t("common.method")}</dt>
            <dd className="mt-1 text-foreground">
              {payment.method ? PAYMENT_METHOD_LABELS[payment.method] : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">{t("modules.payments.reference")}</dt>
            <dd className="mt-1 text-foreground">{payment.reference || "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">Client</dt>
            <dd className="mt-1 text-foreground">{payment.clientName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">Contract</dt>
            <dd className="mt-1 text-foreground">{payment.contractTitle ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">Proiect</dt>
            <dd className="mt-1 text-foreground">{payment.projectName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">{t("modules.payments.paidAt")}</dt>
            <dd className="mt-1 text-foreground">
              {payment.paidAt ? formatDateTime(payment.paidAt) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">Creat</dt>
            <dd className="mt-1 text-foreground">{formatDateTime(payment.createdAt)}</dd>
          </div>
          {payment.proofUrl ? (
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-[0.08em]">{t("modules.payments.proof")}</dt>
              <dd className="mt-1">
                <a
                  href={payment.proofUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-champagne hover:text-champagne-soft"
                >
                  Deschide link
                </a>
              </dd>
            </div>
          ) : null}
        </dl>

        {payment.notes ? (
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground uppercase tracking-[0.08em]">{t("modules.leads.notesLabel")}</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-foreground">{payment.notes}</p>
          </div>
        ) : null}
      </div>

      <PaymentFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        mode="edit"
        initial={{
          id: payment.id,
          label: payment.label,
          clientId: payment.clientId,
          contractId: payment.contractId,
          projectId: payment.projectId,
          amount: payment.amount,
          paidAmount: payment.paidAmount,
          dueDate: payment.dueDate ?? "",
          method: payment.method,
          reference: payment.reference,
          notes: payment.notes,
          proofUrl: payment.proofUrl,
          currency: payment.currency,
        }}
        clients={clients}
        contracts={contracts}
        projects={projects}
        defaultCurrency={defaultCurrency}
        onSuccess={() => router.refresh()}
      />

      <Dialog open={partialOpen} onOpenChange={(next) => !pending && setPartialOpen(next)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("modules.payments.partialTitle")}</DialogTitle>
            <DialogDescription>
              {t("modules.payments.partialHint", { label: payment.label })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleMarkPartial} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="partial-amount">{t("modules.payments.paidAmount")}</Label>
              <Input
                id="partial-amount"
                type="number"
                min={0}
                step="0.01"
                value={partialAmount}
                onChange={(event) => setPartialAmount(event.target.value)}
              />
            </div>
            {Number(partialAmount) > payment.amount ? (
              <div className="flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/10 px-3 py-2">
                <Checkbox
                  id="partial-allowOverpay"
                  checked={allowOverpay}
                  onCheckedChange={(checked) => setAllowOverpay(checked === true)}
                  className="mt-0.5"
                />
                <Label htmlFor="partial-allowOverpay" className="text-xs font-normal text-warning">
                  {t("modules.payments.overTotal")}
                </Label>
              </div>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setPartialOpen(false)}
                disabled={pending}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
