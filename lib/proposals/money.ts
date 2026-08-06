export type DiscountType = "none" | "percent" | "fixed";

export type ProposalItemInput = {
  name: string;
  description?: string | null;
  quantity: number;
  unitPrice: number;
  discount?: number;
  taxRate?: number;
  sortOrder?: number;
};

export type ComputedProposalItem = ProposalItemInput & {
  lineTotal: number;
  taxRate: number;
  discount: number;
};

export type ProposalTotals = {
  items: ComputedProposalItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
};

/** Round half-up to 2 decimal places using integer cents. */
export function roundMoney(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function computeLineTotal(item: ProposalItemInput): number {
  const qty = Number(item.quantity);
  const unit = Number(item.unitPrice);
  const discount = Number(item.discount ?? 0);
  if (!(qty > 0) || !Number.isFinite(unit) || unit < 0 || discount < 0) {
    throw new Error("invalid_line_item");
  }
  const raw = qty * unit - discount;
  if (raw < 0) throw new Error("invalid_line_total");
  return roundMoney(raw);
}

export function computeProposalTotals(input: {
  items: ProposalItemInput[];
  discountType?: DiscountType;
  discountValue?: number;
  taxRate?: number;
}): ProposalTotals {
  if (!input.items.length) {
    throw new Error("items_required");
  }

  const items: ComputedProposalItem[] = input.items.map((item, index) => {
    const lineTotal = computeLineTotal(item);
    return {
      ...item,
      quantity: Number(item.quantity),
      unitPrice: roundMoney(Number(item.unitPrice)),
      discount: roundMoney(Number(item.discount ?? 0)),
      taxRate: roundMoney(Number(item.taxRate ?? 0)),
      lineTotal,
      sortOrder: item.sortOrder ?? index,
    };
  });

  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineTotal, 0));

  const discountType = input.discountType ?? "none";
  const discountValue = Number(input.discountValue ?? 0);
  if (discountValue < 0) throw new Error("invalid_discount");

  let discountAmount = 0;
  if (discountType === "percent") {
    if (discountValue > 100) throw new Error("invalid_discount");
    discountAmount = roundMoney((subtotal * discountValue) / 100);
  } else if (discountType === "fixed") {
    if (discountValue > subtotal) throw new Error("invalid_discount");
    discountAmount = roundMoney(discountValue);
  }

  const taxable = roundMoney(Math.max(subtotal - discountAmount, 0));
  const taxRate = Number(input.taxRate ?? 0);
  if (taxRate < 0 || taxRate > 100) throw new Error("invalid_tax");
  const taxAmount = roundMoney((taxable * taxRate) / 100);
  const total = roundMoney(taxable + taxAmount);

  return { items, subtotal, discountAmount, taxAmount, total };
}
