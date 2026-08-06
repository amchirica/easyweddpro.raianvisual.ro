import type { PaymentStatus } from "@/lib/constants";

/** Statuses that can be derived purely from amount/paid_amount/due_date. */
export type DerivedPaymentStatus = "pending" | "partial" | "paid" | "overdue";

function toDateOnly(value: Date): Date {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function parseDueDate(dueDate: string | null): Date | null {
  if (!dueDate) return null;
  const parsed = new Date(`${dueDate}T00:00:00`);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/**
 * Pure derivation of a payment's status from its numbers.
 * `cancelled` is only used to suppress the "overdue" derivation — the
 * "cancelled" and "refunded" statuses are always set explicitly by their
 * respective actions and never derived here.
 */
export function deriveStatus(
  amount: number,
  paidAmount: number,
  dueDate: string | null,
  cancelled: boolean,
  now: Date = new Date(),
): DerivedPaymentStatus {
  const safeAmount = Number.isFinite(amount) ? Math.max(amount, 0) : 0;
  const safePaid = Number.isFinite(paidAmount) ? Math.max(paidAmount, 0) : 0;
  const remaining = safeAmount - safePaid;

  if (remaining <= 0) return "paid";
  if (safePaid > 0) return "partial";

  if (!cancelled) {
    const due = parseDueDate(dueDate);
    if (due && due.getTime() < toDateOnly(now).getTime()) {
      return "overdue";
    }
  }

  return "pending";
}

/** Whether a (non-cancelled/refunded) payment is currently overdue. */
export function isOverdue(
  dueDate: string | null,
  cancelled: boolean,
  now: Date = new Date(),
): boolean {
  if (cancelled || !dueDate) return false;
  const due = parseDueDate(dueDate);
  return Boolean(due && due.getTime() < toDateOnly(now).getTime());
}

/**
 * Effective status for display: respects explicit terminal statuses
 * (cancelled/refunded) persisted in the database, otherwise recomputes
 * the derived status live so "overdue" stays accurate between writes.
 */
export function effectivePaymentStatus(
  row: { status: string; amount: number; paid_amount: number; due_date: string | null },
  now: Date = new Date(),
): PaymentStatus {
  if (row.status === "cancelled" || row.status === "refunded") {
    return row.status as PaymentStatus;
  }
  return deriveStatus(row.amount, row.paid_amount, row.due_date, false, now);
}
