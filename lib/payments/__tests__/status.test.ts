import { describe, expect, it } from "vitest";

import { deriveStatus, effectivePaymentStatus, isOverdue } from "@/lib/payments/status";

const REFERENCE_DATE = new Date("2026-08-05T12:00:00Z");

describe("deriveStatus", () => {
  it("returns paid when paid amount covers the total", () => {
    expect(deriveStatus(1000, 1000, null, false, REFERENCE_DATE)).toBe("paid");
  });

  it("returns paid when the paid amount exceeds the total (overpay)", () => {
    expect(deriveStatus(1000, 1200, null, false, REFERENCE_DATE)).toBe("paid");
  });

  it("returns paid for a zero-amount payment with nothing paid", () => {
    expect(deriveStatus(0, 0, null, false, REFERENCE_DATE)).toBe("paid");
  });

  it("returns partial when some but not all of the amount is paid", () => {
    expect(deriveStatus(1000, 400, null, false, REFERENCE_DATE)).toBe("partial");
  });

  it("returns pending when nothing is paid and there is no due date", () => {
    expect(deriveStatus(1000, 0, null, false, REFERENCE_DATE)).toBe("pending");
  });

  it("returns pending when nothing is paid and the due date is in the future", () => {
    expect(deriveStatus(1000, 0, "2026-12-31", false, REFERENCE_DATE)).toBe("pending");
  });

  it("returns overdue when nothing is paid and the due date has passed", () => {
    expect(deriveStatus(1000, 0, "2026-01-01", false, REFERENCE_DATE)).toBe("overdue");
  });

  it("never returns overdue when cancelled is true, even past due", () => {
    expect(deriveStatus(1000, 0, "2026-01-01", true, REFERENCE_DATE)).toBe("pending");
  });

  it("returns partial (not overdue) when partially paid and past due", () => {
    expect(deriveStatus(1000, 200, "2026-01-01", false, REFERENCE_DATE)).toBe("partial");
  });
});

describe("isOverdue", () => {
  it("is false when cancelled", () => {
    expect(isOverdue("2026-01-01", true, REFERENCE_DATE)).toBe(false);
  });

  it("is false without a due date", () => {
    expect(isOverdue(null, false, REFERENCE_DATE)).toBe(false);
  });

  it("is true for a past due date", () => {
    expect(isOverdue("2026-01-01", false, REFERENCE_DATE)).toBe(true);
  });

  it("is false for a future due date", () => {
    expect(isOverdue("2026-12-31", false, REFERENCE_DATE)).toBe(false);
  });
});

describe("effectivePaymentStatus", () => {
  it("respects a persisted cancelled status regardless of amounts", () => {
    const status = effectivePaymentStatus(
      { status: "cancelled", amount: 1000, paid_amount: 0, due_date: "2026-01-01" },
      REFERENCE_DATE,
    );
    expect(status).toBe("cancelled");
  });

  it("respects a persisted refunded status regardless of amounts", () => {
    const status = effectivePaymentStatus(
      { status: "refunded", amount: 1000, paid_amount: 1000, due_date: null },
      REFERENCE_DATE,
    );
    expect(status).toBe("refunded");
  });

  it("recomputes overdue live even if the stored status is stale", () => {
    const status = effectivePaymentStatus(
      { status: "pending", amount: 1000, paid_amount: 0, due_date: "2026-01-01" },
      REFERENCE_DATE,
    );
    expect(status).toBe("overdue");
  });
});
