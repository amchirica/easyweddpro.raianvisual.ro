import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

vi.mock("@/lib/data/leads", () => ({
  listLeads: vi.fn(async () => ({
    leads: [{ id: "l1", name: "Ana", email: "a@x.ro", status: "new" }],
    count: 1,
  })),
}));
vi.mock("@/lib/data/clients", () => ({
  listClients: vi.fn(async () => [{ id: "c1", name: "Client", email: "c@x.ro" }]),
}));
vi.mock("@/lib/data/proposals", () => ({
  listProposals: vi.fn(async () => ({
    proposals: [{ id: "p1", title: "Ofertă", status: "draft" }],
    count: 1,
  })),
}));
vi.mock("@/lib/data/contracts", () => ({
  listContracts: vi.fn(async () => ({
    contracts: [{ id: "k1", title: "Contract", contract_number: "C-1", status: "draft" }],
    count: 1,
  })),
}));
vi.mock("@/lib/data/projects", () => ({
  listProjects: vi.fn(async () => [{ id: "pr1", name: "Proiect", location: "Buc", status: "active" }]),
}));
vi.mock("@/lib/data/tasks", () => ({
  listTasks: vi.fn(async () => [{ id: "t1", title: "Task", status: "todo" }]),
}));
vi.mock("@/lib/data/payments", () => ({
  listPayments: vi.fn(async () => ({
    payments: [{ id: "pay1", label: "Avans", reference: null, status: "pending" }],
    count: 1,
  })),
}));
vi.mock("@/lib/data/calendar", () => ({
  listCalendarEvents: vi.fn(async () => [{ id: "e1", title: "Shoot", location: "Studio" }]),
}));
vi.mock("@/lib/data/templates", () => ({
  listTemplates: vi.fn(async () => [{ id: "tmpl1", name: "Template", type: "proposal" }]),
}));
vi.mock("@/lib/data/team", () => ({
  listMembers: vi.fn(async () => [
    {
      membershipId: "m1",
      userId: "u1",
      role: "owner",
      disabledAt: null,
      fullName: "Maria",
    },
  ]),
}));

import { searchWorkspace, WORKSPACE_SEARCH_GROUPS } from "@/lib/search/workspace-search";

describe("searchWorkspace mapping", () => {
  it("covers all workspace groups with detail hrefs", async () => {
    const groups = await searchWorkspace({} as never, "ws1", "ma");
    const byKey = Object.fromEntries(groups.map((g) => [g.key, g]));

    for (const key of WORKSPACE_SEARCH_GROUPS) {
      expect(byKey[key], key).toBeTruthy();
      expect(byKey[key].items.length).toBeGreaterThan(0);
    }

    expect(byKey.leads.items[0].href).toBe("/dashboard/leads/l1");
    expect(byKey.clients.items[0].href).toBe("/dashboard/clients/c1");
    expect(byKey.proposals.items[0].href).toBe("/dashboard/proposals/p1");
    expect(byKey.contracts.items[0].href).toBe("/dashboard/contracts/k1");
    expect(byKey.projects.items[0].href).toBe("/dashboard/projects/pr1");
    expect(byKey.tasks.items[0].href).toBe("/dashboard/tasks/t1");
    expect(byKey.payments.items[0].href).toBe("/dashboard/payments/pay1");
    expect(byKey.calendar.items[0].href).toContain("/dashboard/calendar");
    expect(byKey.calendar.items[0].href).toContain("event=e1");
    expect(byKey.templates.items[0].href).toBe("/dashboard/templates/tmpl1");
    expect(byKey.team.items[0].href).toBe("/dashboard/team/m1");
  });

  it("returns empty under min chars", async () => {
    expect(await searchWorkspace({} as never, "ws1", "a")).toEqual([]);
  });
});
