import { describe, expect, it } from "vitest";

import {
  canAcceptContract,
  canEditContract,
  getEffectiveContractStatus,
} from "@/lib/contracts/status";

describe("getEffectiveContractStatus", () => {
  it("keeps accepted from becoming expired", () => {
    expect(
      getEffectiveContractStatus({
        status: "accepted",
        validUntil: "2000-01-01",
        publicTokenExpiresAt: "2000-01-01T00:00:00.000Z",
        acceptedAt: "2026-01-01T00:00:00.000Z",
      }),
    ).toBe("accepted");
  });

  it("marks published as expired when valid_until passed", () => {
    expect(
      getEffectiveContractStatus({
        status: "published",
        validUntil: "2000-01-01",
      }),
    ).toBe("expired");
  });

  it("only draft is freely editable", () => {
    expect(canEditContract("draft")).toBe(true);
    expect(canEditContract("published")).toBe(false);
    expect(canEditContract("accepted")).toBe(false);
  });

  it("allows accept only for published/viewed", () => {
    expect(canAcceptContract("published")).toBe(true);
    expect(canAcceptContract("viewed")).toBe(true);
    expect(canAcceptContract("cancelled")).toBe(false);
    expect(canAcceptContract("accepted")).toBe(false);
  });
});
