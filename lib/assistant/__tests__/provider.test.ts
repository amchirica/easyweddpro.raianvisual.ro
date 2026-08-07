import { describe, expect, it } from "vitest";

import { answerFromKnowledge } from "@/lib/assistant/answer";
import { buildAssistantContext } from "@/lib/assistant/context";

describe("assistant without AI provider", () => {
  it("knowledge answers still work when AI is not configured", () => {
    const ctx = buildAssistantContext({
      surface: "dashboard",
      pathname: "/dashboard/leads",
      locale: "ro",
      workspaceRole: "owner",
      plan: "solo",
    });
    const answer = answerFromKnowledge("Unde găsesc leadurile?", ctx);
    expect(answer.provider).toBe("knowledge");
    expect(answer.answer.toLowerCase()).toMatch(/lead/);
    expect(answer.resolved).toBe(true);
  });
});
