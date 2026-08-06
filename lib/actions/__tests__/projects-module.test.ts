import { describe, expect, it, vi } from "vitest";

import { DEFAULT_PIPELINE_TEMPLATE_ID } from "@/lib/events/project-pipelines";
import { projectFormSchema } from "@/lib/validations/projects";

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
  cookies: vi.fn(async () => ({
    get: vi.fn(),
    set: vi.fn(),
    getAll: vi.fn(() => []),
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => null),
}));

vi.mock("@/lib/workspace/permissions", () => ({
  requireWorkspaceAction: vi.fn(async () => {
    throw new Error("not_used_in_import_test");
  }),
}));

vi.mock("@/lib/activity/log", () => ({
  logActivity: vi.fn(),
}));

describe("projectFormSchema", () => {
  it("accepts a minimal valid create payload", () => {
    const result = projectFormSchema.safeParse({
      name: "Nuntă Ana & Radu",
      clientId: null,
      eventDate: "2026-09-12",
      status: "booked",
      pipelineKey: "generic",
      deadline: "",
      progress: 0,
      team: [],
      location: "București",
      notes: "",
      budget: 5000,
      cost: 1500,
      estimatedRevenue: 8000,
      currency: "RON",
    });

    expect(result.success).toBe(true);
  });

  it("rejects a name shorter than 2 characters", () => {
    const result = projectFormSchema.safeParse({ name: "A" });
    expect(result.success).toBe(false);
  });

  it("defaults pipelineKey and status when omitted", () => {
    const result = projectFormSchema.safeParse({ name: "Proiect minimal" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.pipelineKey).toBe("generic");
      expect(result.data.status).toBe("booked");
      expect(result.data.progress).toBe(0);
      expect(result.data.team).toEqual([]);
    }
  });
});

describe("DEFAULT_PIPELINE_TEMPLATE_ID", () => {
  it("stays generic, never hardcoded to a specialized vendor pipeline", () => {
    expect(DEFAULT_PIPELINE_TEMPLATE_ID).toBe("generic");
  });
});

describe("project server actions module", () => {
  it("can be imported without runtime reference errors", async () => {
    const projectsActions = await import("@/lib/actions/projects");

    expect(projectsActions.createProjectAction).toBeDefined();
    expect(projectsActions.updateProjectAction).toBeDefined();
    expect(projectsActions.archiveProjectAction).toBeDefined();
    expect(projectsActions.softDeleteProjectAction).toBeDefined();
    expect(projectsActions.restoreProjectAction).toBeDefined();
    expect(projectsActions.createProjectFromContractAction).toBeDefined();
  });

  describe("deriveProjectNameFromContract (idempotency naming helper)", () => {
    it("prefers the client name when present", async () => {
      const { deriveProjectNameFromContract } = await import("@/lib/projects/naming");
      expect(
        deriveProjectNameFromContract({ contractTitle: "Contract nunta", clientName: "Ana Pop" }),
      ).toBe("Proiect – Ana Pop");
    });

    it("falls back to the contract title when there is no client", async () => {
      const { deriveProjectNameFromContract } = await import("@/lib/projects/naming");
      expect(
        deriveProjectNameFromContract({ contractTitle: "Contract eveniment corporate", clientName: null }),
      ).toBe("Contract eveniment corporate");
    });

    it("falls back to a generic name when both are empty", async () => {
      const { deriveProjectNameFromContract } = await import("@/lib/projects/naming");
      expect(deriveProjectNameFromContract({ contractTitle: "", clientName: "  " })).toBe("Proiect nou");
    });

    it("is deterministic for the same input, matching the idempotent-create contract", async () => {
      const { deriveProjectNameFromContract } = await import("@/lib/projects/naming");
      const input = { contractTitle: "Contract foto-video", clientName: "Maria Ionescu" };
      expect(deriveProjectNameFromContract(input)).toBe(deriveProjectNameFromContract(input));
    });
  });
});
