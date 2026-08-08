"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { useToast } from "@/components/shared/toast-provider";
import { Button } from "@/components/ui/button";
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
import {
  ProposalItemsEditor,
  composeProposalItemDescription,
  createEmptyProposalItem,
  parseProposalItemUnit,
  type ProposalItemDraft,
  type ProposalItemFieldErrors,
} from "@/components/proposals/proposal-items-editor";
import { createProposalAction, updateProposalAction } from "@/lib/actions/proposals";
import { formatCurrency } from "@/lib/format";
import { computeProposalTotals, type DiscountType } from "@/lib/proposals/money";
import { proposalFormSchema } from "@/lib/validations/proposals";

export type ProposalFormOption = { id: string; name: string };

export type ProposalFormInitialData = {
  title: string;
  clientId: string | null;
  leadId: string | null;
  currency: string;
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
  validUntil: string | null;
  notes: string | null;
  terms: string | null;
  items: Array<{
    name: string;
    description: string | null;
    quantity: number;
    unitPrice: number;
    discount: number;
  }>;
};

type Target = "client" | "lead";

type FormState = {
  title: string;
  target: Target;
  clientId: string;
  leadId: string;
  currency: string;
  discountType: DiscountType;
  discountValue: string;
  taxRate: string;
  validUntil: string;
  notes: string;
  terms: string;
  items: ProposalItemDraft[];
};

function draftFromItem(item: ProposalFormInitialData["items"][number]): ProposalItemDraft {
  const parsed = parseProposalItemUnit(item.description);
  return {
    key: crypto.randomUUID(),
    name: item.name,
    description: parsed.description,
    unit: parsed.unit,
    quantity: String(item.quantity ?? 1),
    unitPrice: String(item.unitPrice ?? 0),
    discount: String(item.discount ?? 0),
  };
}

function makeInitialState(input: {
  initial?: ProposalFormInitialData;
  defaultClientId?: string | null;
  defaultLeadId?: string | null;
  currency: string;
}): FormState {
  const { initial, defaultClientId, defaultLeadId, currency } = input;

  if (initial) {
    return {
      title: initial.title,
      target: initial.leadId && !initial.clientId ? "lead" : "client",
      clientId: initial.clientId ?? "",
      leadId: initial.leadId ?? "",
      currency: initial.currency,
      discountType: initial.discountType,
      discountValue: String(initial.discountValue),
      taxRate: String(initial.taxRate),
      validUntil: initial.validUntil ?? "",
      notes: initial.notes ?? "",
      terms: initial.terms ?? "",
      items: initial.items.length ? initial.items.map(draftFromItem) : [createEmptyProposalItem()],
    };
  }

  return {
    title: "",
    target: defaultLeadId && !defaultClientId ? "lead" : "client",
    clientId: defaultClientId ?? "",
    leadId: defaultLeadId ?? "",
    currency,
    discountType: "none",
    discountValue: "0",
    taxRate: "19",
    validUntil: "",
    notes: "",
    terms: "",
    items: [createEmptyProposalItem()],
  };
}

type ProposalFormProps = {
  mode: "create" | "edit";
  proposalId?: string;
  initial?: ProposalFormInitialData;
  clients: ProposalFormOption[];
  leads: ProposalFormOption[];
  defaultClientId?: string | null;
  defaultLeadId?: string | null;
  currency?: string;
  canWrite: boolean;
  onCancelEdit?: () => void;
  onSaved?: (proposalId: string) => void;
};

export function ProposalForm({
  mode,
  proposalId,
  initial,
  clients,
  leads,
  defaultClientId = null,
  defaultLeadId = null,
  currency = "RON",
  canWrite,
  onCancelEdit,
  onSaved,
}: ProposalFormProps) {
  const { t } = useI18n();
  const [form, setForm] = useState<FormState>(() =>
    makeInitialState({ initial, defaultClientId, defaultLeadId, currency }),
  );
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [itemErrors, setItemErrors] = useState<Record<number, ProposalItemFieldErrors>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  const totals = useMemo(() => {
    const numericItems = form.items
      .filter((item) => item.name.trim().length > 0)
      .map((item) => ({
        name: item.name.trim(),
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        discount: Number(item.discount || 0) || 0,
      }));

    if (!numericItems.length) return null;

    try {
      return computeProposalTotals({
        items: numericItems,
        discountType: form.discountType,
        discountValue: Number(form.discountValue) || 0,
        taxRate: Number(form.taxRate) || 0,
      });
    } catch {
      return null;
    }
  }, [form.items, form.discountType, form.discountValue, form.taxRate]);

  function buildPayload() {
    return {
      title: form.title,
      clientId: form.target === "client" ? form.clientId || null : null,
      leadId: form.target === "lead" ? form.leadId || null : null,
      currency: form.currency,
      discountType: form.discountType,
      discountValue: form.discountValue,
      taxRate: form.taxRate,
      validUntil: form.validUntil,
      notes: form.notes,
      terms: form.terms,
      items: form.items.map((item, index) => ({
        name: item.name,
        description: composeProposalItemDescription(item),
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        sortOrder: index,
      })),
    };
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (!canWrite) {
      toast(t("modules.proposals.noPermissionSave"), "error");
      return;
    }

    const payload = buildPayload();
    const parsed = proposalFormSchema.safeParse(payload);

    if (!parsed.success) {
      const errors: Record<string, string> = {};
      const nextItemErrors: Record<number, ProposalItemFieldErrors> = {};

      for (const issue of parsed.error.issues) {
        const [root, index, field] = issue.path;
        if (root === "items" && typeof index === "number") {
          const key = (typeof field === "string" ? field : "name") as keyof ProposalItemFieldErrors;
          nextItemErrors[index] = { ...(nextItemErrors[index] ?? {}), [key]: issue.message };
        } else if (typeof root === "string" && !errors[root]) {
          errors[root] = issue.message;
        }
      }

      setFieldErrors(errors);
      setItemErrors(nextItemErrors);
      setFormError(t("common.verifyData"));
      return;
    }

    setFieldErrors({});
    setItemErrors({});
    setFormError(null);
    setSubmitting(true);

    try {
      const result =
        mode === "create"
          ? await createProposalAction(parsed.data)
          : await updateProposalAction(proposalId ?? "", parsed.data);

      if (result?.error) {
        const message =
          result.error || t("modules.proposals.saveFailed");
        setFormError(message);
        toast(message, "error");
        return;
      }

      toast(result?.success ?? (mode === "create" ? t("modules.proposals.created") : t("modules.proposals.updated")), "success");

      if (mode === "create") {
        const newId = result?.data?.proposalId;
        if (newId) router.push(`/dashboard/proposals/${newId}`);
        return;
      }

      router.refresh();
      if (proposalId) onSaved?.(proposalId);
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Create proposal failed", {
          operation: mode === "create" ? "createProposal" : "updateProposal",
          message: error instanceof Error ? error.message : String(error),
        });
      }
      const message = t("modules.proposals.saveFailed");
      setFormError(message);
      toast(message, "error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24 lg:pb-0">
      {!canWrite ? (
        <p className="rounded-md border border-champagne/30 bg-champagne/10 px-3 py-2 text-sm text-champagne-soft">
          {t("modules.proposals.noPermissionEdit")}
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="proposal-title">{t("modules.proposals.formTitle")}</Label>
            <Input
              id="proposal-title"
              value={form.title}
              onChange={(event) => update("title", event.target.value)}
              placeholder={t("modules.proposals.titlePlaceholder")}
              aria-invalid={Boolean(fieldErrors.title)}
              disabled={!canWrite}
            />
            {fieldErrors.title ? <p className="text-xs text-destructive">{fieldErrors.title}</p> : null}
          </div>

          <div className="surface-card space-y-3 p-4">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {t("modules.proposals.recipient")}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                variant={form.target === "client" ? "default" : "outline"}
                onClick={() => update("target", "client")}
                disabled={!canWrite}
              >
                {t("common.client")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={form.target === "lead" ? "default" : "outline"}
                onClick={() => update("target", "lead")}
                disabled={!canWrite}
              >
                {t("common.lead")}
              </Button>
            </div>

            {form.target === "client" ? (
              <div className="space-y-2">
                <Label htmlFor="proposal-client">{t("common.client")}</Label>
                <Select
                  value={form.clientId || undefined}
                  onValueChange={(value) => update("clientId", (value as string) ?? "")}
                >
                  <SelectTrigger id="proposal-client" className="h-8 w-full" disabled={!canWrite}>
                    <SelectValue placeholder={t("modules.proposals.selectClient")} />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {clients.length === 0 ? (
                  <p className="text-xs text-muted-soft">{t("modules.proposals.noClientsYet")}</p>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="proposal-lead">{t("common.lead")}</Label>
                <Select
                  value={form.leadId || undefined}
                  onValueChange={(value) => update("leadId", (value as string) ?? "")}
                >
                  <SelectTrigger id="proposal-lead" className="h-8 w-full" disabled={!canWrite}>
                    <SelectValue placeholder={t("modules.proposals.selectLead")} />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {leads.length === 0 ? (
                  <p className="text-xs text-muted-soft">{t("modules.proposals.noLeadsYet")}</p>
                ) : null}
              </div>
            )}
            {fieldErrors.clientId ? (
              <p className="text-xs text-destructive">{fieldErrors.clientId}</p>
            ) : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="proposal-currency">{t("common.currency")}</Label>
              <Input
                id="proposal-currency"
                value={form.currency}
                maxLength={3}
                onChange={(event) => update("currency", event.target.value.toUpperCase())}
                disabled={!canWrite}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal-validUntil">{t("modules.proposals.validUntil")}</Label>
              <Input
                id="proposal-validUntil"
                type="date"
                value={form.validUntil}
                onChange={(event) => update("validUntil", event.target.value)}
                aria-invalid={Boolean(fieldErrors.validUntil)}
                disabled={!canWrite}
              />
              {fieldErrors.validUntil ? (
                <p className="text-xs text-destructive">{fieldErrors.validUntil}</p>
              ) : null}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
              {t("modules.proposals.items")}
            </p>
            <ProposalItemsEditor
              items={form.items}
              onChange={(items) => update("items", items)}
              discountType={form.discountType}
              discountValue={Number(form.discountValue) || 0}
              taxRate={Number(form.taxRate) || 0}
              currency={form.currency}
              disabled={!canWrite}
              itemErrors={itemErrors}
            />
            {fieldErrors.items ? <p className="text-xs text-destructive">{fieldErrors.items}</p> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="proposal-discountType">{t("modules.proposals.discountType")}</Label>
              <Select
                value={form.discountType}
                onValueChange={(value) => update("discountType", (value as DiscountType) ?? "none")}
              >
                <SelectTrigger id="proposal-discountType" className="h-8 w-full" disabled={!canWrite}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">{t("modules.proposals.noDiscount")}</SelectItem>
                  <SelectItem value="percent">{t("modules.proposals.percentDiscount")}</SelectItem>
                  <SelectItem value="fixed">{t("modules.proposals.fixedDiscount")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal-discountValue">{t("modules.proposals.discountValue")}</Label>
              <Input
                id="proposal-discountValue"
                type="number"
                min={0}
                value={form.discountValue}
                onChange={(event) => update("discountValue", event.target.value)}
                disabled={!canWrite || form.discountType === "none"}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="proposal-taxRate">{t("modules.proposals.taxRate")}</Label>
              <Input
                id="proposal-taxRate"
                type="number"
                min={0}
                max={100}
                value={form.taxRate}
                onChange={(event) => update("taxRate", event.target.value)}
                disabled={!canWrite}
              />
            </div>
          </div>
          {fieldErrors.discountValue ? (
            <p className="text-xs text-destructive">{fieldErrors.discountValue}</p>
          ) : null}
          {fieldErrors.taxRate ? <p className="text-xs text-destructive">{fieldErrors.taxRate}</p> : null}

          <div className="space-y-2">
            <Label htmlFor="proposal-terms">{t("modules.proposals.terms")}</Label>
            <Textarea
              id="proposal-terms"
              rows={4}
              value={form.terms}
              onChange={(event) => update("terms", event.target.value)}
              placeholder={t("modules.proposals.termsPlaceholder")}
              disabled={!canWrite}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="proposal-notes">{t("modules.proposals.internalNotes")}</Label>
            <Textarea
              id="proposal-notes"
              rows={3}
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder={t("modules.proposals.notesPlaceholder")}
              disabled={!canWrite}
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

          <div className="hidden items-center justify-end gap-3 lg:flex">
            {mode === "edit" && onCancelEdit ? (
              <Button type="button" variant="outline" onClick={onCancelEdit} disabled={submitting}>
                {t("common.cancel")}
              </Button>
            ) : null}
            <Button type="submit" disabled={submitting || !canWrite}>
              {submitting ? t("common.saving") : mode === "create" ? t("modules.proposals.createProposal") : t("common.saveChanges")}
            </Button>
          </div>
        </div>

        <div className="hidden lg:block">
          <div className="surface-card sticky top-20 space-y-3 p-5">
            <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">{t("modules.proposals.summary")}</p>
            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t("common.subtotal")}</dt>
                <dd className="text-foreground">{formatCurrency(totals?.subtotal ?? 0, form.currency)}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t("modules.proposals.discount")}</dt>
                <dd className="text-foreground">
                  -{formatCurrency(totals?.discountAmount ?? 0, form.currency)}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">{t("modules.proposals.taxShort")}</dt>
                <dd className="text-foreground">{formatCurrency(totals?.taxAmount ?? 0, form.currency)}</dd>
              </div>
            </dl>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm text-muted-foreground">{t("modules.proposals.total")}</span>
              <span className="font-heading text-xl font-medium text-champagne">
                {formatCurrency(totals?.total ?? 0, form.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur-md lg:hidden">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{t("modules.proposals.totalProposal")}</p>
          <p className="truncate font-heading text-lg font-medium text-champagne">
            {formatCurrency(totals?.total ?? 0, form.currency)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {mode === "edit" && onCancelEdit ? (
            <Button type="button" size="sm" variant="outline" onClick={onCancelEdit} disabled={submitting}>
              {t("common.cancel")}
            </Button>
          ) : null}
          <Button type="submit" size="sm" disabled={submitting || !canWrite}>
            {submitting ? t("common.saving") : mode === "create" ? t("modules.proposals.createShort") : t("common.save")}
          </Button>
        </div>
      </div>
    </form>
  );
}
