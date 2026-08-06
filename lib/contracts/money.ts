import { roundMoney } from "@/lib/proposals/money";

export type ContractMoneyInput = {
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number;
  total?: number;
  depositAmount: number;
};

export type ContractMoneyTotals = {
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  depositAmount: number;
  remainingAmount: number;
};

export function computeContractMoney(input: ContractMoneyInput): ContractMoneyTotals {
  const subtotal = roundMoney(Number(input.subtotal));
  const discountAmount = roundMoney(Number(input.discountAmount ?? 0));
  const taxAmount = roundMoney(Number(input.taxAmount ?? 0));

  if (subtotal < 0 || discountAmount < 0 || taxAmount < 0) {
    throw new Error("invalid_money");
  }

  const total =
    input.total !== undefined && input.total !== null
      ? roundMoney(Number(input.total))
      : roundMoney(Math.max(subtotal - discountAmount, 0) + taxAmount);

  if (total < 0) throw new Error("invalid_total");

  const depositAmount = roundMoney(Number(input.depositAmount));
  if (depositAmount < 0) throw new Error("invalid_deposit");
  if (depositAmount > total) throw new Error("deposit_exceeds_total");

  const remainingAmount = roundMoney(Math.max(total - depositAmount, 0));

  return {
    subtotal,
    discountAmount,
    taxAmount,
    total,
    depositAmount,
    remainingAmount,
  };
}

export function defaultDepositFromTotal(total: number, percent = 30): number {
  return roundMoney((roundMoney(total) * percent) / 100);
}
