import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";

import { taskFormSchema } from "@/lib/validations/tasks";

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
  permissionsForRole: vi.fn(() => ({ isAssigneeOnly: false })),
}));

vi.mock("@/lib/activity/log", () => ({
  logActivity: vi.fn(),
}));

describe("taskFormSchema", () => {
  it("accepts a valid create payload", () => {
    const result = taskFormSchema.safeParse({
      title: "Trimite contractul spre semnare",
      notes: "",
      status: "todo",
      priority: "normal",
      dueDate: "2026-12-31",
      assigneeId: "11111111-1111-4111-8111-111111111111",
      clientId: null,
      projectId: null,
      calendarEventId: null,
      subtasks: [],
    });

    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    const result = taskFormSchema.safeParse({
      title: "a",
      status: "todo",
      priority: "normal",
    });

    expect(result.success).toBe(false);
  });

  it("rejects an invalid status", () => {
    const result = taskFormSchema.safeParse({
      title: "Task valid",
      status: "doing",
      priority: "normal",
    });

    expect(result.success).toBe(false);
  });

  it("accepts subtasks with a done flag", () => {
    const result = taskFormSchema.safeParse({
      title: "Task cu subtask-uri",
      status: "todo",
      priority: "high",
      subtasks: [{ id: "s1", title: "Pasul 1", done: true }],
    });

    expect(result.success).toBe(true);
  });
});

describe("task server actions module", () => {
  it("does not export TaskRow as a runtime value from use server file", () => {
    const source = readFileSync(path.resolve(__dirname, "../tasks.ts"), "utf8");

    expect(source).not.toMatch(/export\s+type\s*\{\s*TaskRow\s*\}/);
    expect(source).not.toMatch(/export\s+\{\s*TaskRow\s*\}/);
    expect(source).not.toMatch(/\bTaskRow\.(parse|safeParse)\b/);
  });

  it("can be imported without runtime reference errors", async () => {
    const tasksActions = await import("@/lib/actions/tasks");

    expect(tasksActions.createTaskAction).toBeDefined();
    expect(tasksActions.updateTaskAction).toBeDefined();
    expect(tasksActions.completeTaskAction).toBeDefined();
    expect(tasksActions.reopenTaskAction).toBeDefined();
    expect(tasksActions.softDeleteTaskAction).toBeDefined();
    expect((tasksActions as Record<string, unknown>).TaskRow).toBeUndefined();
  });
});
