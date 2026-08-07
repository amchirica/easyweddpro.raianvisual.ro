import { describe, expect, it } from "vitest";

import { answerFromKnowledge } from "@/lib/assistant/answer";
import {
  buildAssistantContext,
  planHasFeature,
  resolveModuleKey,
  roleCan,
} from "@/lib/assistant/context";
import { assistantMessages, assistantTitle, normalizeLocale } from "@/lib/assistant/i18n";
import { isRouteAllowed, sanitizeAssistantLinks } from "@/lib/assistant/routes";
import { findModuleByKey, searchKnowledge, searchModules } from "@/lib/assistant/search";

describe("assistant module lookup", () => {
  it("finds dashboard leads module", () => {
    const mod = findModuleByKey("dashboard", "leads");
    expect(mod?.route).toBe("/dashboard/leads");
  });

  it("searches contracts by keyword", () => {
    const hits = searchModules("dashboard", "cum creez contract draft");
    expect(hits[0]?.key).toBe("contracts");
  });
});

describe("assistant pathname context", () => {
  it("resolves leads path", () => {
    expect(resolveModuleKey("/dashboard/leads", "dashboard")).toBe("leads");
  });

  it("resolves contract edit path", () => {
    expect(resolveModuleKey("/dashboard/contracts/123/edit", "dashboard")).toBe("contracts");
  });

  it("resolves automations path", () => {
    expect(resolveModuleKey("/dashboard/automations", "dashboard")).toBe("automations");
  });

  it("resolves admin workspaces", () => {
    expect(resolveModuleKey("/admin/workspaces", "admin")).toBe("admin-workspaces");
  });

  it("answers what can I do on contracts edit", () => {
    const ctx = buildAssistantContext({
      surface: "dashboard",
      pathname: "/dashboard/contracts/abc/edit",
      locale: "ro",
      workspaceRole: "owner",
      plan: "studio",
    });
    const answer = answerFromKnowledge("Ce pot modifica aici?", ctx);
    expect(answer.moduleKey).toBe("contracts");
    expect(answer.answer.toLowerCase()).toMatch(/draft/);
  });
});

describe("assistant role awareness", () => {
  it("blocks viewer from deleting clients", () => {
    expect(roleCan("viewer", "crm.delete")).toBe(false);
    const ctx = buildAssistantContext({
      surface: "dashboard",
      pathname: "/dashboard/clients",
      locale: "ro",
      workspaceRole: "viewer",
      plan: "agency",
    });
    const answer = answerFromKnowledge("De ce nu pot șterge clientul?", ctx);
    expect(answer.answer).toMatch(/nu permite|Rolul tău/i);
  });

  it("allows sales to write leads", () => {
    expect(roleCan("sales", "crm.write")).toBe(true);
  });
});

describe("assistant plan awareness", () => {
  it("free has no automations", () => {
    expect(planHasFeature("free", "automations")).toBe(false);
  });

  it("studio has automations", () => {
    expect(planHasFeature("studio", "automations")).toBe(true);
  });

  it("mentions plan missing for automations on free", () => {
    const ctx = buildAssistantContext({
      surface: "dashboard",
      pathname: "/dashboard/automations",
      locale: "ro",
      workspaceRole: "owner",
      plan: "free",
    });
    const answer = answerFromKnowledge("Cum creez o automatizare?", ctx);
    expect(answer.answer).toMatch(/nu este inclusă|planul actual/i);
    expect(answer.links.some((l) => l.href.includes("billing"))).toBe(true);
  });
});

describe("assistant feature / admin context", () => {
  it("admin surface uses admin modules", () => {
    const hit = searchKnowledge({
      surface: "admin",
      query: "cum inspectez un workspace",
      locale: "ro",
    });
    expect(hit.modules[0]?.key).toBe("admin-workspaces");
  });

  it("admin answers include no cross-tenant data claim", () => {
    const ctx = buildAssistantContext({
      surface: "admin",
      pathname: "/admin/workspaces",
      locale: "ro",
      platformRole: "platform_admin",
    });
    const answer = answerFromKnowledge("Ce pot face aici?", ctx);
    expect(answer.answer).toMatch(/nu afișez date din alte workspace/i);
  });
});

describe("assistant route allowlist", () => {
  it("allows dashboard leads", () => {
    expect(isRouteAllowed("dashboard", "/dashboard/leads")).toBe(true);
  });

  it("rejects api and external", () => {
    expect(isRouteAllowed("dashboard", "/api/assistant")).toBe(false);
    expect(
      sanitizeAssistantLinks("dashboard", [
        { href: "https://evil.example", label: "x" },
        { href: "/dashboard/leads", label: "ok" },
      ]),
    ).toEqual([{ href: "/dashboard/leads", label: "ok" }]);
  });
});

describe("assistant i18n", () => {
  it("normalizes locale", () => {
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("ro")).toBe("ro");
  });

  it("titles differ by surface and locale", () => {
    expect(assistantTitle("ro", "dashboard")).toBe("Asistent EasyWedd Pro");
    expect(assistantTitle("en", "dashboard")).toBe("EasyWedd Pro Assistant");
    expect(assistantTitle("en", "admin")).toBe("Platform Admin Help");
  });

  it("EN messages exist", () => {
    expect(assistantMessages("en").seePlans).toMatch(/plan/i);
  });
});

describe("assistant theme tokens (widget contract)", () => {
  it("i18n strings do not hardcode hex colors", () => {
    const blob = JSON.stringify(assistantMessages("ro")) + JSON.stringify(assistantMessages("en"));
    expect(blob).not.toMatch(/#[0-9a-fA-F]{3,8}/);
  });
});

describe("assistant knowledge fallback", () => {
  it("returns fallback when query is nonsense", () => {
    const ctx = buildAssistantContext({
      surface: "dashboard",
      pathname: "/dashboard",
      locale: "ro",
      workspaceRole: "owner",
      plan: "solo",
    });
    const answer = answerFromKnowledge("zzzz qqqq xyzzy", ctx);
    expect(answer.provider).toBe("knowledge");
    expect(answer.answer.length).toBeGreaterThan(10);
  });
});

describe("assistant workflow", () => {
  it("explains after proposal acceptance", () => {
    const ctx = buildAssistantContext({
      surface: "dashboard",
      pathname: "/dashboard/proposals",
      locale: "ro",
      workspaceRole: "owner",
      plan: "studio",
    });
    const answer = answerFromKnowledge("Ce fac după ce clientul acceptă oferta?", ctx);
    expect(answer.answer.toLowerCase()).toMatch(/contract/);
    expect(answer.answer.toLowerCase()).toMatch(/avans|plat/);
    expect(answer.resolved).toBe(true);
  });
});
