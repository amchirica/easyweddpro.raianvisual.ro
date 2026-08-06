import { AdminTable } from "@/components/admin/admin-table";
import { requirePlatformPermission } from "@/lib/platform/session";

/** Known transactional / reminder template keys used by the product. Documentation only. */
const EMAIL_TEMPLATES = [
  {
    id: "invitation",
    name: "invitation",
    description: "Invitație în workspace (echipă).",
  },
  {
    id: "proposal_sent",
    name: "proposal_sent",
    description: "Ofertă trimisă către client.",
  },
  {
    id: "contract_published",
    name: "contract_published",
    description: "Contract publicat pentru semnare.",
  },
  {
    id: "task_assigned",
    name: "task_assigned",
    description: "Task asignat unui membru.",
  },
  {
    id: "payment_reminder_due_today",
    name: "payment_reminder_due_today",
    description: "Reminder plată scadentă azi.",
  },
  {
    id: "payment_reminder_overdue",
    name: "payment_reminder_overdue",
    description: "Reminder plată restantă.",
  },
  {
    id: "proposal_reminder",
    name: "proposal_reminder",
    description: "Reminder ofertă în așteptare.",
  },
  {
    id: "contract_reminder",
    name: "contract_reminder",
    description: "Reminder contract nesemnat.",
  },
  {
    id: "event_reminder",
    name: "event_reminder",
    description: "Reminder eveniment apropiat.",
  },
  {
    id: "task_reminder",
    name: "task_reminder",
    description: "Reminder task scadență.",
  },
] as const;

export default async function AdminEmailsPage() {
  await requirePlatformPermission("emails.read");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-medium text-foreground">Template-uri email</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Catalog documentar al template-urilor tranzacționale și de reminder folosite de platformă.
          Nu reprezintă volume de trimitere — vezi Deliveries pentru istoricul real.
        </p>
      </div>

      <div className="surface-card overflow-hidden">
        <AdminTable
          rows={EMAIL_TEMPLATES.map((t) => ({ ...t }))}
          columns={[
            {
              key: "name",
              header: "Cheie template",
              cell: (row) => <code className="text-foreground">{row.name}</code>,
            },
            {
              key: "description",
              header: "Descriere",
              cell: (row) => <span className="text-muted-foreground">{row.description}</span>,
            },
          ]}
        />
      </div>
    </div>
  );
}
