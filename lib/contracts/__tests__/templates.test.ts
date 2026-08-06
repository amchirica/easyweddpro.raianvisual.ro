import { describe, expect, it } from "vitest";

import {
  extractTemplateVariables,
  hasUnresolvedCriticalPlaceholders,
  resolveTemplateVariables,
} from "@/lib/contracts/templates";

describe("contract template variables", () => {
  it("resolves allowlisted variables only", () => {
    const result = resolveTemplateVariables(
      "Client {{client_name}} — total {{total}} {{currency}}",
      { client_name: "Ana", total: "1000", currency: "RON" },
    );
    expect(result.text).toBe("Client Ana — total 1000 RON");
    expect(result.unresolved).toEqual([]);
  });

  it("keeps unknown variables unresolved", () => {
    const result = resolveTemplateVariables("Hi {{evil_eval}}", {
      client_name: "Ana",
    });
    expect(result.text).toContain("{{evil_eval}}");
    expect(result.unresolved).toContain("evil_eval");
  });

  it("detects unresolved critical placeholders", () => {
    const critical = hasUnresolvedCriticalPlaceholders(
      ["Contract {{contract_number}} pentru {{client_name}}"],
      { client_name: "Ana" },
    );
    expect(critical).toContain("contract_number");
  });

  it("extracts variable names", () => {
    expect(extractTemplateVariables("{{total}} / {{deposit}}")).toEqual([
      "total",
      "deposit",
    ]);
  });
});
