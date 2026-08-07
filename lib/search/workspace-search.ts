import "server-only";

import { listCalendarEvents } from "@/lib/data/calendar";
import { listClients } from "@/lib/data/clients";
import { listContracts } from "@/lib/data/contracts";
import { listLeads } from "@/lib/data/leads";
import { listPayments } from "@/lib/data/payments";
import { listProjects } from "@/lib/data/projects";
import { listProposals } from "@/lib/data/proposals";
import { listTasks } from "@/lib/data/tasks";
import { listTemplates } from "@/lib/data/templates";
import { listMembers } from "@/lib/data/team";
import type { Database } from "@/types/database";
import type { SupabaseClient } from "@supabase/supabase-js";

export type SearchHit = {
  id: string;
  title: string;
  subtitle?: string;
  href: string;
  group: SearchGroupKey;
};

export type SearchGroupKey =
  | "leads"
  | "clients"
  | "proposals"
  | "contracts"
  | "projects"
  | "tasks"
  | "payments"
  | "calendar"
  | "templates"
  | "team";

export type SearchGroup = {
  key: SearchGroupKey;
  items: SearchHit[];
};

export const WORKSPACE_SEARCH_GROUPS: SearchGroupKey[] = [
  "leads",
  "clients",
  "proposals",
  "contracts",
  "projects",
  "tasks",
  "payments",
  "calendar",
  "templates",
  "team",
];

const LIMIT = 5;

function settled<T>(result: PromiseSettledResult<T>, fallback: T): T {
  return result.status === "fulfilled" ? result.value : fallback;
}

export async function searchWorkspace(
  supabase: SupabaseClient<Database>,
  workspaceId: string,
  query: string,
): Promise<SearchGroup[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const results = await Promise.allSettled([
    listLeads(supabase, { workspaceId, search: q, limit: LIMIT }),
    listClients(supabase, workspaceId, { search: q, limit: LIMIT }),
    listProposals(supabase, { workspaceId, search: q, limit: LIMIT }),
    listContracts(supabase, { workspaceId, search: q, limit: LIMIT }),
    listProjects(supabase, { workspaceId, search: q, limit: LIMIT }),
    listTasks(supabase, workspaceId, { search: q, limit: LIMIT }),
    listPayments(supabase, workspaceId, { search: q, limit: LIMIT }),
    listCalendarEvents(supabase, workspaceId, { search: q, limit: LIMIT }),
    listTemplates(supabase, workspaceId, { search: q, limit: LIMIT }),
    listMembers(supabase, workspaceId),
  ]);

  const leads = settled(results[0], { leads: [], count: 0 });
  const clients = settled(results[1], []);
  const proposals = settled(results[2], { proposals: [], count: 0 });
  const contracts = settled(results[3], { contracts: [], count: 0 });
  const projects = settled(results[4], []);
  const tasks = settled(results[5], []);
  const payments = settled(results[6], { payments: [], count: 0 });
  const calendar = settled(results[7], []);
  const templates = settled(results[8], []);
  const team = settled(results[9], []);

  const qLower = q.toLowerCase();
  const teamHits = team
    .filter((m) => !m.disabledAt)
    .filter(
      (m) =>
        (m.fullName ?? "").toLowerCase().includes(qLower) ||
        m.role.toLowerCase().includes(qLower) ||
        m.userId.toLowerCase().includes(qLower),
    )
    .slice(0, LIMIT)
    .map(
      (m): SearchHit => ({
        id: m.membershipId,
        title: m.fullName || m.userId.slice(0, 8),
        subtitle: m.role,
        href: `/dashboard/team/${m.membershipId}`,
        group: "team",
      }),
    );

  const groups: SearchGroup[] = [
    {
      key: "leads",
      items: leads.leads.map((row) => ({
        id: row.id,
        title: row.name,
        subtitle: row.email ?? row.status ?? undefined,
        href: `/dashboard/leads/${row.id}`,
        group: "leads",
      })),
    },
    {
      key: "clients",
      items: clients.map((row) => ({
        id: row.id,
        title: row.name,
        subtitle: row.email ?? undefined,
        href: `/dashboard/clients/${row.id}`,
        group: "clients",
      })),
    },
    {
      key: "proposals",
      items: proposals.proposals.map((row) => ({
        id: row.id,
        title: row.title,
        subtitle: row.status ?? undefined,
        href: `/dashboard/proposals/${row.id}`,
        group: "proposals",
      })),
    },
    {
      key: "contracts",
      items: contracts.contracts.map((row) => ({
        id: row.id,
        title: row.title,
        subtitle: row.contract_number ?? row.status ?? undefined,
        href: `/dashboard/contracts/${row.id}`,
        group: "contracts",
      })),
    },
    {
      key: "projects",
      items: projects.map((row) => ({
        id: row.id,
        title: row.name,
        subtitle: row.location ?? row.status ?? undefined,
        href: `/dashboard/projects/${row.id}`,
        group: "projects",
      })),
    },
    {
      key: "tasks",
      items: tasks.map((row) => ({
        id: row.id,
        title: row.title,
        subtitle: row.status ?? undefined,
        href: `/dashboard/tasks/${row.id}`,
        group: "tasks",
      })),
    },
    {
      key: "payments",
      items: payments.payments.map((row) => ({
        id: row.id,
        title: row.label || row.reference || row.id.slice(0, 8),
        subtitle: row.status ?? undefined,
        href: `/dashboard/payments/${row.id}`,
        group: "payments",
      })),
    },
    {
      key: "calendar",
      items: calendar.map((row) => ({
        id: row.id,
        title: row.title,
        subtitle: row.location ?? undefined,
        href: `/dashboard/calendar?event=${row.id}`,
        group: "calendar",
      })),
    },
    {
      key: "templates",
      items: templates.map((row) => ({
        id: row.id,
        title: row.name,
        subtitle: row.type ?? undefined,
        href: `/dashboard/templates/${row.id}`,
        group: "templates",
      })),
    },
    { key: "team", items: teamHits },
  ];

  return groups.filter((g) => g.items.length > 0);
}
