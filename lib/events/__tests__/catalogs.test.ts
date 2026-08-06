import { describe, expect, it } from "vitest";

import { EVENT_TYPES, getEventTypeLabel } from "@/lib/events/event-types";
import { getDashboardWidgetsForBusinessTypes } from "@/lib/events/dashboard-widgets";
import { getPipelineTemplate, resolvePipelineTemplateForCategories } from "@/lib/events/project-pipelines";
import { PROPOSAL_UNITS } from "@/lib/events/units";
import { VENDOR_TYPES } from "@/lib/events/vendor-types";

describe("event industry catalogs", () => {
  it("includes core vendor types across industries", () => {
    const codes = VENDOR_TYPES.map((item) => item.code);
    expect(codes).toContain("photographer");
    expect(codes).toContain("dj");
    expect(codes).toContain("venue");
    expect(codes).toContain("wedding_planner");
    expect(codes).toContain("florist");
    expect(codes).toContain("other_vendor");
  });

  it("includes generalized event types", () => {
    const labels = EVENT_TYPES.map((item) => item.label);
    expect(labels).toContain("Nuntă");
    expect(labels).toContain("Eveniment corporate");
    expect(labels).toContain("Festival");
    expect(getEventTypeLabel("wedding")).toBe("Nuntă");
  });

  it("exposes configurable proposal units", () => {
    expect(PROPOSAL_UNITS.map((item) => item.code)).toEqual(
      expect.arrayContaining(["service", "hour", "day", "person", "km", "package", "event"]),
    );
  });

  it("resolves pipeline templates by business category", () => {
    expect(resolvePipelineTemplateForCategories(["photo_video"])).toBe("photo_video");
    expect(resolvePipelineTemplateForCategories(["venue"])).toBe("venue");
    expect(resolvePipelineTemplateForCategories(["photo_video", "planning"])).toBe("generic");
    expect(getPipelineTemplate("generic").stages[0]?.label).toBe("Rezervare");
  });

  it("keeps common dashboard widgets and adds specialty ones", () => {
    const widgets = getDashboardWidgetsForBusinessTypes(["venue", "planning"]);
    expect(widgets.some((item) => item.id === "new_leads")).toBe(true);
    expect(widgets.some((item) => item.id === "venue_occupancy")).toBe(true);
    expect(widgets.some((item) => item.id === "planner_active_events")).toBe(true);
  });
});
