import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

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

vi.mock("@/lib/automations/engine", () => ({
  runAutomationsForTrigger: vi.fn(async () => undefined),
}));

describe("contracts server actions module", () => {
  it("exports the required draft lifecycle actions", () => {
    const source = readFileSync(
      path.resolve(__dirname, "../contracts.ts"),
      "utf8",
    );
    for (const name of [
      "createContractAction",
      "updateContractDraftAction",
      "softDeleteContractAction",
      "archiveContractAction",
      "restoreContractAction",
      "publishContractAction",
    ]) {
      expect(source).toContain(`export async function ${name}`);
    }
  });

  it(
    "can be imported without runtime reference errors",
    async () => {
      const actions = await import("@/lib/actions/contracts");
      expect(actions.createContractAction).toBeDefined();
      expect(actions.softDeleteContractAction).toBeDefined();
      expect(actions.archiveContractAction).toBeDefined();
    },
    20000,
  );
});
