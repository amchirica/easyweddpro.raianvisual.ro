import { AlertTriangle, TrendingUp, Wallet } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { listSubscriptionsForAdmin } from "@/lib/data/admin";
import { formatCurrency, formatDate } from "@/lib/format";
import { requirePlatformAdmin } from "@/lib/workspace/session";

const PLAN_LABEL: Record<string, string> = {
  free: "Free",
  solo: "Solo",
  studio: "Studio",
  agency: "Agency",
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "accent"> = {
  active: "success",
  trialing: "accent",
  past_due: "warning",
  suspended: "danger",
  cancelled: "danger",
};

const STATUS_LABEL: Record<string, string> = {
  active: "Activ",
  trialing: "Trial",
  past_due: "Restanță",
  suspended: "Suspendat",
  cancelled: "Anulat",
};

export default async function AdminSubscriptionsPage() {
  const admin = await requirePlatformAdmin();
  const subscriptions = await listSubscriptionsForAdmin(admin.supabase);

  const mrr = subscriptions.filter((s) => s.status === "active").reduce((sum, s) => sum + s.amount, 0);
  const activeCount = subscriptions.filter((s) => s.status === "active").length;
  const pastDueCount = subscriptions.filter((s) => s.status === "past_due").length;

  return (
    <div>
      <PageHeader
        title="Abonamente"
        description="Facturare la nivel de platformă pentru toate workspace-urile."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="MRR activ" value={formatCurrency(mrr)} icon={Wallet} />
        <StatCard label="Abonamente active" value={activeCount.toString()} icon={TrendingUp} />
        <StatCard label="Restanțe" value={pastDueCount.toString()} hint="Necesită atenție" icon={AlertTriangle} />
      </div>

      {subscriptions.length === 0 ? (
        <div className="mt-8">
          <EmptyState icon={Wallet} title="Niciun abonament" description="Nu există încă abonamente înregistrate." />
        </div>
      ) : (
        <div className="surface-card mt-8 overflow-x-auto">
          <table className="w-full min-w-[680px] border-collapse text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-5 py-3 font-medium">Workspace</th>
                <th className="px-5 py-3 font-medium">Plan</th>
                <th className="px-5 py-3 font-medium">Valoare</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Perioadă curentă până la</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((sub) => (
                <tr key={sub.id} className="border-b border-border/60 last:border-0">
                  <td className="px-5 py-3.5 text-foreground">{sub.workspaceName}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">{PLAN_LABEL[sub.plan] ?? sub.plan}</td>
                  <td className="px-5 py-3.5 text-muted-foreground">
                    {sub.amount === 0 ? "—" : formatCurrency(sub.amount)}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge
                      label={STATUS_LABEL[sub.status] ?? sub.status}
                      tone={STATUS_TONE[sub.status] ?? "accent"}
                    />
                  </td>
                  <td className="px-5 py-3.5 text-muted-soft">
                    {sub.currentPeriodEnd ? formatDate(sub.currentPeriodEnd) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
