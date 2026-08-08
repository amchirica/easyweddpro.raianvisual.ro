"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useEffect, useMemo, useState, type FormEvent } from "react";

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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPaymentAction, updatePaymentAction } from "@/lib/actions/payments";
import { PAYMENT_METHODS, PAYMENT_METHOD_LABELS, type PaymentMethod } from "@/lib/constants";
import { paymentFormSchema } from "@/lib/validations/payments";

export type PaymentFormOption = { id: string; name: string };

export type PaymentFormInitial = {
  id: string;
  label: string;
  clientId: string | null;
  contractId: string | null;
  projectId: string | null;
  amount: number;
  paidAmount: number;
  dueDate: string;
  method: PaymentMethod | null;
  reference: string;
  notes: string;
  proofUrl: string;
  currency: string;
};

type PaymentFormState = {
  label: string;
  clientId: string;
  contractId: string;
  projectId: string;
  amount: string;
  paidAmount: string;
  dueDate: string;
  method: PaymentMethod | "";
  reference: string;
  notes: string;
  proofUrl: string;
  currency: string;
  allowOverpay: boolean;
};

function emptyForm(defaultCurrency: string): PaymentFormState {
  return {
    label: "",
    clientId: "",
    contractId: "",
    projectId: "",
    amount: "",
    paidAmount: "0",
    dueDate: "",
    method: "",
    reference: "",
    notes: "",
    proofUrl: "",
    currency: defaultCurrency,
    allowOverpay: false,
  };
}

function formFromInitial(initial: PaymentFormInitial): PaymentFormState {
  return {
    label: initial.label,
    clientId: initial.clientId ?? "",
    contractId: initial.contractId ?? "",
    projectId: initial.projectId ?? "",
    amount: String(initial.amount),
    paidAmount: String(initial.paidAmount),
    dueDate: initial.dueDate,
    method: initial.method ?? "",
    reference: initial.reference,
    notes: initial.notes,
    proofUrl: initial.proofUrl,
    currency: initial.currency,
    allowOverpay: false,
  };
}

type PaymentFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initial?: PaymentFormInitial;
  clients: PaymentFormOption[];
  contracts: PaymentFormOption[];
  projects: PaymentFormOption[];
  defaultCurrency: string;
  onSuccess?: () => void;
};

export function PaymentFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  clients,
  contracts,
  projects,
  defaultCurrency,
  onSuccess,
}: PaymentFormDialogProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<PaymentFormState>(() =>
    initial ? formFromInitial(initial) : emptyForm(defaultCurrency),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional open-only reset
    setForm(initial ? formFromInitial(initial) : emptyForm(defaultCurrency));
    setFieldErrors({});
    setFormError(null);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps -- reset only when dialog opens

  const isOverpaying = useMemo(() => {
    const amount = Number(form.amount);
    const paid = Number(form.paidAmount);
    return Number.isFinite(amount) && Number.isFinite(paid) && paid > amount && amount >= 0;
  }, [form.amount, form.paidAmount]);

  function updateField<K extends keyof PaymentFormState>(key: K, value: PaymentFormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    const payload = {
      label: form.label,
      clientId: form.clientId || null,
      contractId: form.contractId || null,
      projectId: form.projectId || null,
      amount: form.amount,
      paidAmount: form.paidAmount,
      dueDate: form.dueDate,
      method: form.method || null,
      reference: form.reference,
      notes: form.notes,
      proofUrl: form.proofUrl,
      currency: form.currency,
      allowOverpay: form.allowOverpay,
    };

    const parsed = paymentFormSchema.safeParse(payload);
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      setFormError(t("common.verifyData"));
      return;
    }

    setFieldErrors({});
    setFormError(null);
    setSubmitting(true);

    const result =
      mode === "create"
        ? await createPaymentAction(parsed.data)
        : await updatePaymentAction(initial?.id ?? "", parsed.data);

    setSubmitting(false);

    if (result?.error || !result?.data) {
      setFormError(result?.error ?? "Nu am putut salva plata.");
      return;
    }

    toast(result.success ?? (mode === "create" ? "Plată creată." : "Plată actualizată."), "success");
    onOpenChange(false);
    onSuccess?.();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !submitting && onOpenChange(next)}>
      <DialogContent className="max-h-[85vh] max-w-lg overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? t("modules.payments.new") : t("modules.payments.edit")}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? t("modules.payments.createHint")
              : t("modules.payments.editHint")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="payment-label">Denumire</Label>
            <Input
              id="payment-label"
              value={form.label}
              onChange={(event) => updateField("label", event.target.value)}
              placeholder="Ex: Avans rezervare"
              aria-invalid={Boolean(fieldErrors.label)}
            />
            {fieldErrors.label ? (
              <p className="text-xs text-destructive">{fieldErrors.label}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">{t("modules.payments.totalAmount")}</Label>
              <Input
                id="payment-amount"
                type="number"
                min={0}
                step="0.01"
                value={form.amount}
                onChange={(event) => updateField("amount", event.target.value)}
                aria-invalid={Boolean(fieldErrors.amount)}
              />
              {fieldErrors.amount ? (
                <p className="text-xs text-destructive">{fieldErrors.amount}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-paidAmount">{t("modules.payments.paidAmount")}</Label>
              <Input
                id="payment-paidAmount"
                type="number"
                min={0}
                step="0.01"
                value={form.paidAmount}
                onChange={(event) => updateField("paidAmount", event.target.value)}
                aria-invalid={Boolean(fieldErrors.paidAmount)}
              />
              {fieldErrors.paidAmount ? (
                <p className="text-xs text-destructive">{fieldErrors.paidAmount}</p>
              ) : null}
            </div>
          </div>

          {isOverpaying ? (
            <div className="flex items-start gap-2.5 rounded-md border border-warning/30 bg-warning/10 px-3 py-2">
              <Checkbox
                id="payment-allowOverpay"
                checked={form.allowOverpay}
                onCheckedChange={(checked) => updateField("allowOverpay", checked === true)}
                className="mt-0.5"
              />
              <Label htmlFor="payment-allowOverpay" className="text-xs font-normal text-warning">
                {t("modules.payments.overpayWarn")}
              </Label>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment-dueDate">{t("modules.payments.dueDate")}</Label>
              <Input
                id="payment-dueDate"
                type="date"
                value={form.dueDate}
                onChange={(event) => updateField("dueDate", event.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-method">{t("common.method")}</Label>
              <Select
                value={form.method || undefined}
                onValueChange={(value) => updateField("method", (value as PaymentMethod) ?? "")}
              >
                <SelectTrigger id="payment-method" className="h-8 w-full">
                  <SelectValue placeholder={t("modules.payments.selectMethod")} />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method} value={method}>
                      {PAYMENT_METHOD_LABELS[method]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment-client">Client</Label>
              <Select
                value={form.clientId || undefined}
                onValueChange={(value) => updateField("clientId", value ?? "")}
              >
                <SelectTrigger id="payment-client" className="h-8 w-full">
                  <SelectValue placeholder={t("common.noClient")} />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-currency">{t("modules.payments.currencyLabel")}</Label>
              <Input
                id="payment-currency"
                value={form.currency}
                onChange={(event) => updateField("currency", event.target.value.toUpperCase())}
                maxLength={3}
              />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="payment-contract">Contract</Label>
              <Select
                value={form.contractId || undefined}
                onValueChange={(value) => updateField("contractId", value ?? "")}
              >
                <SelectTrigger id="payment-contract" className="h-8 w-full">
                  <SelectValue placeholder={t("modules.payments.noContract")} />
                </SelectTrigger>
                <SelectContent>
                  {contracts.map((contract) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-project">Proiect</Label>
              <Select
                value={form.projectId || undefined}
                onValueChange={(value) => updateField("projectId", value ?? "")}
              >
                <SelectTrigger id="payment-project" className="h-8 w-full">
                  <SelectValue placeholder={t("modules.payments.noProject")} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-reference">{t("modules.payments.reference")}</Label>
            <Input
              id="payment-reference"
              value={form.reference}
              onChange={(event) => updateField("reference", event.target.value)}
              placeholder={t("modules.payments.referencePh")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-proofUrl">{t("modules.payments.proofUrl")}</Label>
            <Input
              id="payment-proofUrl"
              value={form.proofUrl}
              onChange={(event) => updateField("proofUrl", event.target.value)}
              placeholder="https://…"
              aria-invalid={Boolean(fieldErrors.proofUrl)}
            />
            {fieldErrors.proofUrl ? (
              <p className="text-xs text-destructive">{fieldErrors.proofUrl}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment-notes">{t("modules.leads.notesLabel")}</Label>
            <Textarea
              id="payment-notes"
              rows={3}
              value={form.notes}
              onChange={(event) => updateField("notes", event.target.value)}
            />
          </div>

          {formError ? (
            <p
              className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              role="alert"
            >
              {formError}
            </p>
          ) : null}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={submitting}
            >
              {t("common.cancel")}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? t("common.saving")
                : mode === "create"
                  ? t("modules.payments.createPayment")
                  : t("common.saveChanges")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
