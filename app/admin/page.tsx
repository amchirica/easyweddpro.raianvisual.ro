import {
  Activity,
  Building2,
  Bug,
  Mail,
  MessageSquareWarning,
  Timer,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminErrorState } from "@/components/admin/admin-error-state";
import { getPlatformKpis } from "@/lib/data/admin-kpis";
import { formatCurrency } from "@/lib/format";
import { requirePlatformPermission } from "@/lib/platform/session";

export default async function AdminDashboardPage() {
  const admin = await requirePlatformPermission("dashboard.read");

  let kpis = null;
  let loadError: string | null = null;
  try {
    kpis = await getPlatformKpis(admin.supabase);
  } catch (error) {
    loadError = error instanceof Error ? error.message : "Nu am putut încărca KPI-urile.";
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Admin Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Indicatori reali ai platformei. MRR este calculat în RON pe baza planurilor active.
        </p>
      </div>

      {loadError ? <AdminErrorState message={loadError} /> : null}

      {kpis ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetricCard icon={Users} label="Utilizatori" value={kpis.usersTotal} hint={`${kpis.usersNew30d} noi / 30z`} />
            <AdminMetricCard icon={Users} label="Activi 7z / 30z" value={`${kpis.usersActive7d} / ${kpis.usersActive30d}`} />
            <AdminMetricCard icon={Building2} label="Workspace-uri" value={kpis.workspacesTotal} />
            <AdminMetricCard icon={Wallet} label="MRR (RON)" value={formatCurrency(kpis.mrrRon, "RON")} hint={`ARR ~ ${formatCurrency(kpis.arrRon, "RON")}`} />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetricCard label="Trial-uri" value={kpis.trialsActive} />
            <AdminMetricCard label="Plătite" value={kpis.subscriptionsPaid} />
            <AdminMetricCard label="Past due" value={kpis.subscriptionsPastDue} />
            <AdminMetricCard label="Anulate/suspendate" value={kpis.subscriptionsCancelled} />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetricCard icon={Mail} label="Email trimise 24h" value={kpis.emailsSent24h} />
            <AdminMetricCard icon={Mail} label="Email eșuate 24h" value={kpis.emailsFailed24h} />
            <AdminMetricCard icon={Timer} label="Cron failures 24h" value={kpis.cronFailures24h} />
            <AdminMetricCard icon={Activity} label="Automation failures 24h" value={kpis.automationFailures24h} />
          </section>

          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <AdminMetricCard icon={MessageSquareWarning} label="Feedback nou" value={kpis.feedbackNew} />
            <AdminMetricCard icon={Bug} label="Erori deschise" value={kpis.errorsOpen} />
            <AdminMetricCard icon={TrendingUp} label="Leaduri platformă" value={kpis.leadsTotal} />
            <AdminMetricCard label="Oferte / Contracte / Proiecte" value={`${kpis.proposalsTotal} / ${kpis.contractsTotal} / ${kpis.projectsTotal}`} />
          </section>
        </>
      ) : null}
    </div>
  );
}
