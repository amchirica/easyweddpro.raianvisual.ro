import Link from "next/link";
import { Mail } from "lucide-react";

import { AdminMetricCard } from "@/components/admin/admin-metric-card";
import { AdminTable } from "@/components/admin/admin-table";
import { getEmailTemplateStatsForAdmin } from "@/lib/data/admin";
import { getTranslator } from "@/lib/i18n/t";
import { requirePlatformPermission } from "@/lib/platform/session";

/** Known transactional / reminder template keys used by the product. */
const EMAIL_TEMPLATE_KEYS = [
  { id: "invitation", name: "invitation", descriptionKey: "admin.emailInviteDesc" },
  { id: "proposal_sent", name: "proposal_sent", descriptionKey: "admin.emailProposalDesc" },
  {
    id: "contract_published",
    name: "contract_published",
    descriptionKey: "admin.emailContractPublishedDesc",
  },
  { id: "task_assigned", name: "task_assigned", descriptionKey: "admin.emailTaskAssignedDesc" },
  {
    id: "payment_reminder_due_today",
    name: "payment_reminder_due_today",
    descriptionKey: "admin.emailPaymentDueDesc",
  },
  {
    id: "payment_reminder_overdue",
    name: "payment_reminder_overdue",
    descriptionKey: "admin.emailPaymentOverdueDesc",
  },
  {
    id: "proposal_reminder",
    name: "proposal_reminder",
    descriptionKey: "admin.emailProposalPendingDesc",
  },
  {
    id: "contract_reminder",
    name: "contract_reminder",
    descriptionKey: "admin.emailContractReminderDesc",
  },
  {
    id: "event_reminder",
    name: "event_reminder",
    descriptionKey: "admin.emailEventReminderDesc",
  },
  { id: "task_reminder", name: "task_reminder", descriptionKey: "admin.emailTaskDueDesc" },
] as const;

export default async function AdminEmailsPage() {
  const { t } = await getTranslator();
  const admin = await requirePlatformPermission("emails.read");
  const stats = await getEmailTemplateStatsForAdmin(admin.supabase);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-heading text-3xl font-medium text-foreground">
            {t("admin.emailTemplatesTitle")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{t("admin.emailsCatalogHint")}</p>
        </div>
        <Link
          href="/admin/email-deliveries"
          className="text-sm text-champagne hover:text-champagne-soft"
        >
          Vezi livrările →
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <AdminMetricCard icon={Mail} label="Livrări 7 zile" value={stats.total} />
        <AdminMetricCard label="Trimise 7 zile" value={stats.sent} />
        <AdminMetricCard label="Eșuate 7 zile" value={stats.failed} />
      </section>

      <div className="surface-card overflow-hidden">
        <AdminTable
          rows={EMAIL_TEMPLATE_KEYS.map((row) => ({
            ...row,
            stats: stats.byTemplate.get(row.name) ?? {
              total: 0,
              sent: 0,
              failed: 0,
              skipped: 0,
            },
          }))}
          columns={[
            {
              key: "name",
              header: t("admin.templateKey"),
              cell: (row) => <code className="text-foreground">{row.name}</code>,
            },
            {
              key: "description",
              header: t("common.description"),
              cell: (row) => (
                <span className="text-muted-foreground">{t(row.descriptionKey)}</span>
              ),
            },
            {
              key: "stats",
              header: "7 zile",
              cell: (row) => (
                <span className="text-muted-soft">
                  {row.stats.total === 0
                    ? "—"
                    : `${row.stats.sent} sent · ${row.stats.failed} fail · ${row.stats.skipped} skip`}
                </span>
              ),
            },
          ]}
        />
      </div>
    </div>
  );
}
