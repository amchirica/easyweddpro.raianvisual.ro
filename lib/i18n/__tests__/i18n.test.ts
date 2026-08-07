import { describe, expect, it } from "vitest";

import { normalizeLocale, normalizeTheme } from "@/lib/i18n/config";
import { getDictionary, translate } from "@/lib/i18n/dictionary";
import { themeAntiFlashScript } from "@/lib/i18n/get-theme";

describe("i18n config", () => {
  it("normalizes locale cookie values", () => {
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("EN-US")).toBe("en");
    expect(normalizeLocale("ro")).toBe("ro");
    expect(normalizeLocale("xx")).toBe("ro");
    expect(normalizeLocale(undefined)).toBe("ro");
  });

  it("normalizes theme cookie values", () => {
    expect(normalizeTheme("light")).toBe("light");
    expect(normalizeTheme("system")).toBe("system");
    expect(normalizeTheme("dark")).toBe("dark");
    expect(normalizeTheme("weird")).toBe("dark");
  });

  it("translates nested keys with params", () => {
    const dict = getDictionary("en");
    expect(translate(dict, "nav.leads")).toBe("Leads");
    expect(translate(dict, "search.helpLink", { module: "Leads" })).toContain("Leads");
    expect(translate(dict, "missing.key")).toBe("missing.key");
  });

  it("emits anti-flash theme script", () => {
    const script = themeAntiFlashScript("dark");
    expect(script).toContain("classList");
    expect(script).toContain("dark");
  });
});
