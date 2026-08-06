import { describe, expect, it } from "vitest";

import {
  AUTOMATION_ACTION_TYPES,
  AUTOMATION_TRIGGERS,
  evaluateConditions,
  isAutomationActionType,
  isAutomationTriggerKey,
} from "@/lib/automations/catalog";

describe("automations catalog", () => {
  it("exposes the trigger keys required by the Wave 3 plan", () => {
    const required = [
      "lead_created",
      "proposal_published",
      "proposal_accepted",
      "contract_published",
      "contract_accepted",
      "payment_due",
      "payment_overdue",
      "event_upcoming",
      "task_overdue",
      "project_stage_changed",
    ];
    for (const key of required) {
      expect(AUTOMATION_TRIGGERS).toContain(key);
    }
  });

  it("exposes the action types required by the Wave 3 plan", () => {
    const required = [
      "create_task",
      "create_reminder",
      "change_status",
      "log_activity",
      "prepare_email",
      "send_email",
    ];
    for (const type of required) {
      expect(AUTOMATION_ACTION_TYPES).toContain(type);
    }
  });

  it("validates trigger keys and action types via type guards", () => {
    expect(isAutomationTriggerKey("lead_created")).toBe(true);
    expect(isAutomationTriggerKey("not_a_trigger")).toBe(false);
    expect(isAutomationActionType("send_email")).toBe(true);
    expect(isAutomationActionType("not_an_action")).toBe(false);
  });

  describe("evaluateConditions", () => {
    it("returns true when there are no conditions", () => {
      expect(evaluateConditions([], {})).toBe(true);
    });

    it("evaluates eq/neq/contains/exists operators", () => {
      const metadata = { source: "Website", score: 42 };
      expect(evaluateConditions([{ field: "source", operator: "eq", value: "Website" }], metadata)).toBe(
        true,
      );
      expect(evaluateConditions([{ field: "source", operator: "neq", value: "Website" }], metadata)).toBe(
        false,
      );
      expect(
        evaluateConditions([{ field: "source", operator: "contains", value: "web" }], metadata),
      ).toBe(true);
      expect(evaluateConditions([{ field: "source", operator: "exists" }], metadata)).toBe(true);
      expect(evaluateConditions([{ field: "missing", operator: "exists" }], metadata)).toBe(false);
    });

    it("evaluates numeric comparisons", () => {
      const metadata = { score: 42 };
      expect(evaluateConditions([{ field: "score", operator: "gt", value: 10 }], metadata)).toBe(true);
      expect(evaluateConditions([{ field: "score", operator: "lt", value: 10 }], metadata)).toBe(false);
      expect(evaluateConditions([{ field: "score", operator: "gte", value: 42 }], metadata)).toBe(true);
      expect(evaluateConditions([{ field: "score", operator: "lte", value: 41 }], metadata)).toBe(false);
    });

    it("requires every condition to match (AND semantics)", () => {
      const metadata = { source: "Website", score: 42 };
      expect(
        evaluateConditions(
          [
            { field: "source", operator: "eq", value: "Website" },
            { field: "score", operator: "gt", value: 100 },
          ],
          metadata,
        ),
      ).toBe(false);
    });
  });
});
