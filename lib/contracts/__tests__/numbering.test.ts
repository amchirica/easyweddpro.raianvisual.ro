import { describe, expect, it } from "vitest";

/** Mirrors SQL next_contract_number format: CTR-YYYY-NNNN */
function formatContractNumber(year: number, seq: number): string {
  return `CTR-${year}-${String(seq).padStart(4, "0")}`;
}

describe("contract numbering format", () => {
  it("formats CTR-YYYY-NNNN", () => {
    expect(formatContractNumber(2026, 1)).toBe("CTR-2026-0001");
    expect(formatContractNumber(2026, 12)).toBe("CTR-2026-0012");
  });
});
