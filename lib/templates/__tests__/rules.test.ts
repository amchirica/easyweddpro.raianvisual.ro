import { describe, expect, it } from "vitest";

import { collectTemplateVariableTokens, idsToUnsetDefault } from "@/lib/templates/rules";

describe("idsToUnsetDefault", () => {
  it("returns ids of other defaults with the same type", () => {
    const templates = [
      { id: "a", type: "proposal", isDefault: true },
      { id: "b", type: "proposal", isDefault: false },
      { id: "c", type: "proposal", isDefault: true },
      { id: "d", type: "contract", isDefault: true },
    ];

    expect(idsToUnsetDefault(templates, "c")).toEqual(["a"]);
  });

  it("returns an empty array when the target is the only default", () => {
    const templates = [
      { id: "a", type: "proposal", isDefault: true },
      { id: "b", type: "proposal", isDefault: false },
    ];

    expect(idsToUnsetDefault(templates, "a")).toEqual([]);
  });

  it("returns an empty array when there are no existing defaults", () => {
    const templates = [
      { id: "a", type: "proposal", isDefault: false },
      { id: "b", type: "proposal", isDefault: false },
    ];

    expect(idsToUnsetDefault(templates, "a")).toEqual([]);
  });
});

describe("collectTemplateVariableTokens", () => {
  it("extracts unique lowercase variable names", () => {
    const tokens = collectTemplateVariableTokens([
      "Bună {{client_name}}, evenimentul din {{event_date}} este confirmat.",
      "Total: {{TOTAL}} {{currency}}",
      "{{client_name}} din nou",
    ]);

    expect(tokens.sort()).toEqual(["client_name", "currency", "event_date", "total"]);
  });

  it("returns an empty array when there are no tokens", () => {
    expect(collectTemplateVariableTokens(["Text simplu fără variabile."])).toEqual([]);
  });
});
