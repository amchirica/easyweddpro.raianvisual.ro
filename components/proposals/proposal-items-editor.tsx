"use client";

import { useI18n } from "@/components/providers/i18n-provider";

import { useMemo } from "react";
import { Plus, Trash2 } from "lucide-react";

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
import { PROPOSAL_UNITS } from "@/lib/events/units";
import { formatCurrency } from "@/lib/format";
import { computeLineTotal, computeProposalTotals, type DiscountType } from "@/lib/proposals/money";

export type ProposalItemDraft = {
  key: string;
  name: string;
  description: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  discount: string;
};

export function createEmptyProposalItem(): ProposalItemDraft {
  return {
    key: crypto.randomUUID(),
    name: "",
    description: "",
    unit: "service",
    quantity: "1",
    unitPrice: "0",
    discount: "0",
  };
}

/** Compose description with unit metadata for gradual persistence without DB migration. */
export function composeProposalItemDescription(item: ProposalItemDraft): string {
  const unitLabel = PROPOSAL_UNITS.find((entry) => entry.code === item.unit)?.label ?? item.unit;
  const body = item.description.replace(/^Unitate:\s*.+$/m, "").trim();
  return [`Unitate: ${unitLabel}`, body].filter(Boolean).join("\n");
}

export function parseProposalItemUnit(description: string | null | undefined): {
  unit: string;
  description: string;
} {
  const text = description ?? "";
  const match = text.match(/^Unitate:\s*(.+)$/m);
  const label = match?.[1]?.trim() ?? "";
  const unit =
    PROPOSAL_UNITS.find((entry) => entry.label === label)?.code ??
    (label ? "service" : "service");
  return {
    unit,
    description: text.replace(/^Unitate:\s*.+$/m, "").trim(),
  };
}

export type ProposalItemFieldErrors = Partial<Record<"name" | "quantity" | "unitPrice" | "discount", string>>;

type ProposalItemsEditorProps = {
  items: ProposalItemDraft[];
  onChange: (items: ProposalItemDraft[]) => void;
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
  currency: string;
  disabled?: boolean;
  itemErrors?: Record<number, ProposalItemFieldErrors>;
};

function previewLineTotal(item: ProposalItemDraft): number | null {
  try {
    return computeLineTotal({
      name: item.name,
      quantity: Number(item.quantity),
      unitPrice: Number(item.unitPrice),
      discount: Number(item.discount || 0),
    });
  } catch {
    return null;
  }
}

export function ProposalItemsEditor({
  items,
  onChange,
  discountType,
  discountValue,
  taxRate,
  currency,
  disabled = false,
  itemErrors,
}: ProposalItemsEditorProps) {
  const { t } = useI18n();
  function updateItem(index: number, patch: Partial<ProposalItemDraft>) {
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function addItem() {
    onChange([...items, createEmptyProposalItem()]);
  }

  function removeItem(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  const { totals, computeError } = useMemo(() => {
    const numericItems = items
      .filter((item) => item.name.trim().length > 0)
      .map((item) => ({
        name: item.name.trim(),
        description: item.description.trim() || undefined,
        quantity: Number(item.quantity) || 0,
        unitPrice: Number(item.unitPrice) || 0,
        discount: Number(item.discount || 0) || 0,
      }));

    if (numericItems.length === 0) {
      return { totals: null, computeError: null as string | null };
    }

    try {
      return {
        totals: computeProposalTotals({ items: numericItems, discountType, discountValue, taxRate }),
        computeError: null as string | null,
      };
    } catch {
      return {
        totals: null,
        computeError: t("modules.proposals.computeError"),
      };
    }
  }, [items, discountType, discountValue, taxRate]);

  return (
    <div className="space-y-4">
      <div className="hidden gap-3 px-1 text-xs font-medium tracking-[0.08em] text-muted-foreground uppercase sm:grid sm:grid-cols-[minmax(0,2fr)_110px_90px_120px_100px_120px_32px]">
        <span>{t("modules.proposals.nameAndDescription")}</span>
        <span>{t("modules.proposals.unit")}</span>
        <span>{t("modules.proposals.qtyShort")}</span>
        <span>{t("modules.proposals.unitPrice")}</span>
        <span>{t("modules.proposals.discount")}</span>
        <span className="text-right">{t("modules.proposals.lineTotal")}</span>
        <span aria-hidden />
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const lineTotal = previewLineTotal(item);
          const errors = itemErrors?.[index];
          return (
            <div
              key={item.key}
              className="surface-card space-y-3 p-4 sm:grid sm:grid-cols-[minmax(0,2fr)_110px_90px_120px_100px_120px_32px] sm:items-start sm:gap-3 sm:space-y-0 sm:p-3"
            >
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`item-name-${item.key}`} className="sm:sr-only">
                    {t("modules.proposals.itemNameLabel")}
                  </Label>
                  <Input
                    id={`item-name-${item.key}`}
                    value={item.name}
                    onChange={(event) => updateItem(index, { name: event.target.value })}
                    placeholder={t("modules.proposals.itemNamePh")}
                    aria-invalid={Boolean(errors?.name)}
                    disabled={disabled}
                  />
                  {errors?.name ? <p className="text-xs text-destructive">{errors.name}</p> : null}
                </div>
                <Textarea
                  rows={2}
                  value={item.description}
                  onChange={(event) => updateItem(index, { description: event.target.value })}
                  placeholder={t("modules.proposals.itemDescPh")}
                  disabled={disabled}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`item-unit-${item.key}`} className="sm:sr-only">
                  {t("modules.proposals.unit")}
                </Label>
                <Select
                  value={item.unit}
                  onValueChange={(value) => updateItem(index, { unit: value ?? "service" })}
                  disabled={disabled}
                >
                  <SelectTrigger id={`item-unit-${item.key}`} className="h-8 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPOSAL_UNITS.map((unit) => (
                      <SelectItem key={unit.code} value={unit.code}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`item-qty-${item.key}`} className="sm:sr-only">
                  {t("modules.proposals.qty")}
                </Label>
                <Input
                  id={`item-qty-${item.key}`}
                  type="number"
                  min={0}
                  step="1"
                  value={item.quantity}
                  onChange={(event) => updateItem(index, { quantity: event.target.value })}
                  aria-invalid={Boolean(errors?.quantity)}
                  disabled={disabled}
                />
                {errors?.quantity ? <p className="text-xs text-destructive">{errors.quantity}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`item-price-${item.key}`} className="sm:sr-only">
                  {t("modules.proposals.unitPrice")}
                </Label>
                <Input
                  id={`item-price-${item.key}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.unitPrice}
                  onChange={(event) => updateItem(index, { unitPrice: event.target.value })}
                  aria-invalid={Boolean(errors?.unitPrice)}
                  disabled={disabled}
                />
                {errors?.unitPrice ? <p className="text-xs text-destructive">{errors.unitPrice}</p> : null}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`item-discount-${item.key}`} className="sm:sr-only">
                  {t("modules.proposals.lineDiscount")}
                </Label>
                <Input
                  id={`item-discount-${item.key}`}
                  type="number"
                  min={0}
                  step="0.01"
                  value={item.discount}
                  onChange={(event) => updateItem(index, { discount: event.target.value })}
                  aria-invalid={Boolean(errors?.discount)}
                  disabled={disabled}
                />
                {errors?.discount ? <p className="text-xs text-destructive">{errors.discount}</p> : null}
              </div>

              <div className="flex items-center justify-between sm:justify-end sm:pt-1.5">
                <span className="text-xs text-muted-foreground sm:hidden">{t("modules.proposals.lineTotal")}</span>
                <span className="font-medium text-foreground">
                  {lineTotal === null ? "—" : formatCurrency(lineTotal, currency)}
                </span>
              </div>

              <div className="flex justify-end sm:pt-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeItem(index)}
                  disabled={disabled || items.length <= 1}
                  aria-label={t("modules.proposals.removeItem")}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addItem} disabled={disabled}>
        <Plus data-icon="inline-start" />
        {t("modules.proposals.addItem")}
      </Button>

      <div className="surface-card space-y-2 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("common.subtotal")}</span>
          <span className="text-foreground">{formatCurrency(totals?.subtotal ?? 0, currency)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("modules.proposals.discount")}</span>
          <span className="text-foreground">-{formatCurrency(totals?.discountAmount ?? 0, currency)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("modules.proposals.taxShort")}</span>
          <span className="text-foreground">{formatCurrency(totals?.taxAmount ?? 0, currency)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <span className="text-sm font-medium text-foreground">{t("modules.proposals.totalProposal")}</span>
          <span className="font-heading text-lg font-medium text-champagne">
            {formatCurrency(totals?.total ?? 0, currency)}
          </span>
        </div>
        {computeError ? <p className="text-xs text-destructive">{computeError}</p> : null}
      </div>
    </div>
  );
}
