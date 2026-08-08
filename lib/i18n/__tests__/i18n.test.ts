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

  it("keeps RO and EN message keys in parity", () => {
    const ro = getDictionary("ro");
    const en = getDictionary("en");

    function flatten(obj: unknown, prefix = ""): string[] {
      if (!obj || typeof obj !== "object" || Array.isArray(obj)) {
        return prefix ? [prefix] : [];
      }
      const keys: string[] = [];
      for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
        const next = prefix ? `${prefix}.${k}` : k;
        if (v && typeof v === "object" && !Array.isArray(v)) keys.push(...flatten(v, next));
        else keys.push(next);
      }
      return keys;
    }

    const roKeys = new Set(flatten(ro));
    const enKeys = new Set(flatten(en));
    const missingInEn = [...roKeys].filter((k) => !enKeys.has(k));
    const missingInRo = [...enKeys].filter((k) => !roKeys.has(k));

    expect(missingInEn, `Missing in EN: ${missingInEn.slice(0, 20).join(", ")}`).toEqual([]);
    expect(missingInRo, `Missing in RO: ${missingInRo.slice(0, 20).join(", ")}`).toEqual([]);
  });
});
