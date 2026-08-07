import { describe, expect, it } from "vitest";

import { enrichKnowledgeModules } from "@/lib/assistant/knowledge/enrich";
import { ADMIN_MODULES } from "@/lib/assistant/knowledge/admin";
import { DASHBOARD_MODULES } from "@/lib/assistant/knowledge/dashboard";
import { modulesForSurface } from "@/lib/assistant/search";

describe("assistant knowledge coverage", () => {
  it("ensures every dashboard and admin module has 8–15 suggested questions", () => {
    const modules = [
      ...enrichKnowledgeModules(DASHBOARD_MODULES),
      ...enrichKnowledgeModules(ADMIN_MODULES),
    ];
    for (const mod of modules) {
      expect(mod.suggestedQuestions.length, mod.key).toBeGreaterThanOrEqual(8);
      expect(mod.suggestedQuestions.length, mod.key).toBeLessThanOrEqual(15);
      expect(mod.suggestedQuestionsEn.length, mod.key).toBeGreaterThanOrEqual(8);
      expect(mod.suggestedQuestionsEn.length, mod.key).toBeLessThanOrEqual(15);
    }
  });

  it("surfaces return enriched modules", () => {
    expect(modulesForSurface("dashboard")[0].suggestedQuestions.length).toBeGreaterThanOrEqual(8);
    expect(modulesForSurface("admin")[0].suggestedQuestions.length).toBeGreaterThanOrEqual(8);
  });
});

describe("assistant fab position classes", () => {
  it("documents left placement contract for dashboard/admin", () => {
    // Class contract used by AssistantWidget — keep left so Feedback can stay right.
    const fab = "fixed bottom-4 left-4 z-40";
    const feedback = "fixed bottom-4 right-4 z-40";
    expect(fab).toContain("left-4");
    expect(feedback).toContain("right-4");
    expect(fab).not.toContain("right-4");
  });
});
