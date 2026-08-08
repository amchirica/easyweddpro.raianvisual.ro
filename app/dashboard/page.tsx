import type { Metadata } from "next";

import { DashboardHomeClient } from "@/components/dashboard/dashboard-home-client";
import { mapActivityRow } from "@/lib/crm/mappers";
import { getDashboardStats as getLiveDashboardStats } from "@/lib/data/dashboard";
import { getWorkspaceOrDemo } from "@/lib/workspace/session";

export const metadata: Metadata = {
  title: "Dashboard · EasyWedd Pro",
};

export default async function DashboardPage() {
  const ctx = await getWorkspaceOrDemo();
  const stats = await getLiveDashboardStats(ctx.supabase, ctx.workspace.id);

  return (
    <DashboardHomeClient
      currency={ctx.workspace.currency}
      stats={{
        newLeadsThisMonth: stats.newLeadsThisMonth,
        activeLeads: stats.activeLeads,
        conversionRate: stats.conversionRate,
        clientsCount: stats.clientsCount,
        pipelineValue: stats.pipelineValue,
        dueFollowUps: stats.dueFollowUps,
        pipelineByStatus: stats.pipelineByStatus,
        leadSources: stats.leadSources,
        recentActivity: stats.recentActivity.map(mapActivityRow),
      }}
    />
  );
}
